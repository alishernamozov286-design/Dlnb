import { Request, Response } from 'express';
import Service from '../models/Service';
import path from 'path';
import fs from 'fs';

export const createService = async (req: Request, res: Response) => {
  try {
    console.log('=== CREATE SERVICE REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('User:', (req as any).user);
    
    const { name, description } = req.body;
    const user = (req as any).user;

    // Validation
    if (!name || !name.trim()) {
      console.log('Validation failed: name is empty');
      return res.status(400).json({
        success: false,
        message: 'Xizmat nomi kiritilishi shart',
      });
    }

    if (!description || !description.trim()) {
      console.log('Validation failed: description is empty');
      return res.status(400).json({
        success: false,
        message: 'Tavsif kiritilishi shart',
      });
    }

    if (!user || !user._id) {
      console.log('Validation failed: user not authenticated');
      return res.status(401).json({
        success: false,
        message: 'Autentifikatsiya talab qilinadi',
      });
    }

    const serviceData: any = {
      name: name.trim(),
      description: description.trim(),
      createdBy: user._id,
    };

    if (req.file) {
      serviceData.image = `/uploads/services/${req.file.filename}`;
    }

    console.log('Creating service with data:', serviceData);
    const service = await Service.create(serviceData);
    console.log('Service created successfully:', service._id);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Xizmat muvaffaqiyatli yaratildi',
    });
  } catch (error: any) {
    console.error('Create service error:', error);
    console.error('Error stack:', error.stack);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Xizmat yaratishda xatolik',
      error: error.message,
    });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user || !user._id) {
      return res.status(401).json({
        success: false,
        message: 'Autentifikatsiya talab qilinadi',
      });
    }

    const services = await Service.find({ 
      isActive: true,
      createdBy: user._id 
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Xizmatlarni olishda xatolik',
      error: error.message,
    });
  }
};

export const getPublicServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('name description image')
      .sort({ createdAt: -1 });

    console.log('🔍 Found services:', services.length);
    
    const servicesWithUrls = services.map(service => {
      // Rasm URL ni to'g'ri formatlash - faqat relative path qaytarish
      // Frontend o'zi to'g'ri base URL qo'shadi
      console.log('📸 Service:', service.name, '| Image path:', service.image);
      
      return {
        _id: service._id,
        name: service.name,
        description: service.description,
        imageUrl: service.image, // Faqat relative path: /uploads/services/...
      };
    });

    console.log('✅ Sending services with image paths:', servicesWithUrls);

    res.json({
      success: true,
      services: servicesWithUrls,
    });
  } catch (error: any) {
    console.error('Get public services error:', error);
    res.status(500).json({
      success: false,
      message: 'Xizmatlarni olishda xatolik',
      error: error.message,
    });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Xizmat topilmadi',
      });
    }

    const updateData: any = { name, description };

    if (req.file) {
      // Delete old image
      if (service.image) {
        const oldImagePath = path.join(__dirname, '../../', service.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/services/${req.file.filename}`;
    }

    const updatedService = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      data: updatedService,
    });
  } catch (error: any) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Xizmatni yangilashda xatolik',
      error: error.message,
    });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Xizmat topilmadi',
      });
    }

    // Delete image
    if (service.image) {
      const imagePath = path.join(__dirname, '../../', service.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Service.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Xizmat o\'chirildi',
    });
  } catch (error: any) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Xizmatni o\'chirishda xatolik',
      error: error.message,
    });
  }
};
