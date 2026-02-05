import { Response } from 'express';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import smsService from '../services/smsService';

// Get all bookings
export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, date } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      filter.bookingDate = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(filter)
      .populate('createdBy', 'name username')
      .sort({ bookingDate: 1, createdAt: -1 });

    res.json({ bookings });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get booking by ID
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('createdBy', 'name username');

    if (!booking) {
      return res.status(404).json({ message: 'Bron topilmadi' });
    }

    res.json({ booking });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create booking
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, phoneNumber, licensePlate, bookingDate, birthDate } = req.body;

    console.log('=== YANGI BRON YARATISH ===');
    console.log('Mijoz:', customerName);
    console.log('Kun (input):', bookingDate);
    console.log('Tug\'ilgan kun:', birthDate);

    // Sanani UTC formatida parse qilish
    const [year, month, day] = bookingDate.split('-').map(Number);
    const bookingDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    console.log('Tekshiriladigan kun (UTC):', bookingDay.toISOString());

    // Faqat kun bo'yicha tekshirish - bir kunda faqat bitta bron
    const existingBooking = await Booking.findOne({
      bookingDate: { $gte: bookingDay, $lt: nextDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    console.log('Shu kunda bron topildi:', existingBooking ? 'HA' : 'YO\'Q');
    if (existingBooking) {
      console.log('   Mavjud bron:', existingBooking.customerName, existingBooking.bookingDate.toISOString());
    }

    if (existingBooking) {
      console.log('❌ XATOLIK: Bu kun allaqachon band');
      return res.status(400).json({ 
        message: `Bu kun allaqachon band (${existingBooking.customerName})` 
      });
    }

    console.log('✅ Bron yaratilmoqda...');

    // Tug'ilgan kunni parse qilish (agar mavjud bo'lsa)
    let parsedBirthDate;
    if (birthDate) {
      const [bYear, bMonth, bDay] = birthDate.split('-').map(Number);
      parsedBirthDate = new Date(Date.UTC(bYear, bMonth - 1, bDay, 0, 0, 0, 0));
    }

    const booking = new Booking({
      customerName,
      phoneNumber,
      licensePlate: licensePlate.toUpperCase(),
      bookingDate: bookingDay,
      birthDate: parsedBirthDate,
      createdBy: req.user!._id,
    });

    await booking.save();
    await booking.populate('createdBy', 'name username');

    console.log('✅ Bron muvaffaqiyatli yaratildi!');
    console.log('   Saqlangan sana:', booking.bookingDate.toISOString());

    // SMS yuborish
    const formattedDate = bookingDay.toLocaleDateString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    await smsService.sendBookingCreatedSms(
      phoneNumber,
      customerName,
      formattedDate,
      booking._id.toString()
    );

    res.status(201).json({ 
      message: 'Bron muvaffaqiyatli yaratildi',
      booking 
    });
  } catch (error: any) {
    console.error('❌ Xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update booking
export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customerName, phoneNumber, licensePlate, bookingDate, birthDate, status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Bron topilmadi' });
    }

    console.log('=== BRON YANGILASH ===');
    console.log('Bron ID:', id);

    // Agar sana o'zgartirilsa, tekshirish
    if (bookingDate) {
      const [year, month, day] = bookingDate.split('-').map(Number);
      const bookingDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

      console.log('Yangi kun (UTC):', bookingDay.toISOString());

      // Faqat kun bo'yicha tekshirish - bir kunda faqat bitta bron
      const existingBooking = await Booking.findOne({
        _id: { $ne: id },
        bookingDate: { $gte: bookingDay, $lt: nextDay },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingBooking) {
        console.log('❌ XATOLIK: Bu kun allaqachon band');
        return res.status(400).json({ 
          message: `Bu kun allaqachon band (${existingBooking.customerName})` 
        });
      }
    }

    if (customerName) booking.customerName = customerName;
    if (phoneNumber) booking.phoneNumber = phoneNumber;
    if (licensePlate) booking.licensePlate = licensePlate.toUpperCase();
    if (bookingDate) {
      const [year, month, day] = bookingDate.split('-').map(Number);
      booking.bookingDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
    if (birthDate) {
      const [bYear, bMonth, bDay] = birthDate.split('-').map(Number);
      booking.birthDate = new Date(Date.UTC(bYear, bMonth - 1, bDay, 0, 0, 0, 0));
    }
    
    // Status o'zgarishini kuzatish
    const oldStatus = booking.status;
    if (status) booking.status = status;

    await booking.save();
    await booking.populate('createdBy', 'name username');

    console.log('✅ Bron muvaffaqiyatli yangilandi!');

    // Status o'zgarganda SMS yuborish
    if (status && status !== oldStatus) {
      const formattedDate = booking.bookingDate.toLocaleDateString('uz-UZ', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      if (status === 'confirmed') {
        await smsService.sendBookingConfirmedSms(
          booking.phoneNumber,
          booking.customerName,
          formattedDate,
          booking._id.toString()
        );
      } else if (status === 'completed') {
        await smsService.sendBookingCompletedSms(
          booking.phoneNumber,
          booking.customerName,
          booking._id.toString()
        );
      } else if (status === 'cancelled') {
        await smsService.sendBookingCancelledSms(
          booking.phoneNumber,
          booking.customerName,
          booking._id.toString()
        );
      }
    }

    res.json({ 
      message: 'Bron muvaffaqiyatli yangilandi',
      booking 
    });
  } catch (error: any) {
    console.error('❌ Xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete booking
export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Bron topilmadi' });
    }

    await Booking.findByIdAndDelete(id);

    res.json({ message: 'Bron muvaffaqiyatli o\'chirildi' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get bookings statistics
export const getBookingStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayBookings, upcomingBookings, totalPending, totalConfirmed] = await Promise.all([
      Booking.countDocuments({ 
        bookingDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['pending', 'confirmed'] }
      }),
      Booking.countDocuments({ 
        bookingDate: { $gte: tomorrow },
        status: { $in: ['pending', 'confirmed'] }
      }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
    ]);

    res.json({
      stats: {
        todayBookings,
        upcomingBookings,
        totalPending,
        totalConfirmed,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
