import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, username, password, phone, percentage, role, profileImage, profession, experience } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu username allaqachon band' });
    }

    if (email && email.trim()) {
      const existingEmail = await User.findOne({ email: email.trim() });
      if (existingEmail) {
        return res.status(400).json({ message: 'Bu email allaqachon band' });
      }
    }

    if (phone && phone.trim()) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return res.status(400).json({ message: 'Bu telefon raqam allaqachon band' });
      }
    }

    const userData: any = { 
      name, 
      username, 
      password, 
      role 
    };
    
    if (email && email.trim()) {
      userData.email = email.trim();
    }
    if (phone && phone.trim()) {
      userData.phone = phone.trim();
    }
    if (percentage !== undefined) {
      userData.percentage = percentage;
    }
    if (profileImage) userData.profileImage = profileImage;
    if (profession) userData.profession = profession;
    if (experience !== undefined) userData.experience = experience;

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        role: user.role,
        earnings: user.earnings || 0,
        totalEarnings: user.totalEarnings || 0,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone } = req.body;

    console.log('Login request:', { username, email, password: password ? '***' : undefined, phone }); // Debug

    // Agar telefon raqam berilgan bo'lsa (shogirtlar uchun - username va telefon raqam)
    if (phone) {
      if (!username) {
        return res.status(400).json({ message: 'Username kiritilishi kerak' });
      }

      // Username va telefon raqam bilan kirish
      const user = await User.findOne({ 
        username: username,
        phone: phone.trim() 
      });
      
      console.log('Apprentice user found:', user ? 'Yes' : 'No'); // Debug
      
      if (!user) {
        return res.status(400).json({ message: 'Username yoki telefon raqam noto\'g\'ri' });
      }

      // Faqat shogirtlar telefon raqam bilan kira oladi
      if (user.role !== 'apprentice') {
        return res.status(400).json({ message: 'Bu ma\'lumotlar bilan kirish mumkin emas' });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
          percentage: user.percentage,
          role: user.role,
          earnings: user.earnings || 0,
          totalEarnings: user.totalEarnings || 0,
          profileImage: user.profileImage,
          profession: user.profession,
          experience: user.experience,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }

    // Username/email bilan kirish (ustoz uchun)
    const loginField = username || email;
    if (!loginField) {
      return res.status(400).json({ message: 'Username, email yoki telefon raqam kerak' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Parol kerak' });
    }

    const user = await User.findOne({
      $or: [
        { username: loginField },
        { email: loginField }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        role: user.role,
        earnings: user.earnings || 0,
        totalEarnings: user.totalEarnings || 0,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        role: user.role,
        earnings: user.earnings || 0,
        totalEarnings: user.totalEarnings || 0,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;
    const filter: any = {};
    
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password');
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApprentices = async (req: AuthRequest, res: Response) => {
  try {
    const apprentices = await User.find({ role: 'apprentice' }).select('-password');
    res.json({ apprentices });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Ustoz o'zi qo'shgan shogirdlarni olish
export const getMyApprentices = async (req: AuthRequest, res: Response) => {
  try {
    const masterId = req.user!._id;
    
    // Faqat shu ustoz qo'shgan shogirdlarni topish
    const apprentices = await User.find({ 
      role: 'apprentice',
      masterId: masterId 
    }).select('-password').lean();
    
    res.json({ apprentices });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Ustoz o'zi qo'shgan shogirdlarni statistika bilan olish
export const getMyApprenticesWithStats = async (req: AuthRequest, res: Response) => {
  try {
    const masterId = req.user!._id;
    const Task = require('../models/Task').default;
    
    // Faqat shu ustoz qo'shgan shogirdlarni topish
    const apprentices = await User.find({ 
      role: 'apprentice',
      masterId: masterId 
    }).select('-password').lean();
    
    // Har bir shogird uchun statistika hisoblash
    const apprenticesWithStats = await Promise.all(
      apprentices.map(async (apprentice) => {
        const tasks = await Task.find({ assignedTo: apprentice._id });
        
        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length,
          approvedTasks: tasks.filter((t: any) => t.status === 'approved').length,
          inProgressTasks: tasks.filter((t: any) => t.status === 'in-progress').length,
          assignedTasks: tasks.filter((t: any) => t.status === 'assigned').length,
          rejectedTasks: tasks.filter((t: any) => t.status === 'rejected').length,
          performance: tasks.length > 0 
            ? Math.round((tasks.filter((t: any) => t.status === 'approved').length / tasks.length) * 100)
            : 0,
          awards: tasks.filter((t: any) => t.status === 'approved').length
        };
        
        return {
          ...apprentice,
          stats
        };
      })
    );
    
    res.json({ users: apprenticesWithStats });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApprenticesWithStats = async (req: AuthRequest, res: Response) => {
  try {
    const Task = require('../models/Task').default;
    
    const apprentices = await User.find({ role: 'apprentice' }).select('-password').lean();
    
    // Get task statistics for each apprentice
    const apprenticesWithStats = await Promise.all(
      apprentices.map(async (apprentice) => {
        // Eski tizim (assignedTo) va yangi tizim (assignments) uchun vazifalarni qidirish
        const tasks = await Task.find({
          $or: [
            { assignedTo: apprentice._id }, // Eski tizim
            { 'assignments.apprentice': apprentice._id } // Yangi tizim
          ]
        });
        
        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length,
          approvedTasks: tasks.filter((t: any) => t.status === 'approved').length,
          inProgressTasks: tasks.filter((t: any) => t.status === 'in-progress').length,
          assignedTasks: tasks.filter((t: any) => t.status === 'assigned').length,
          rejectedTasks: tasks.filter((t: any) => t.status === 'rejected').length,
          performance: tasks.length > 0 
            ? Math.round((tasks.filter((t: any) => t.status === 'approved').length / tasks.length) * 100)
            : 0,
          awards: tasks.filter((t: any) => t.status === 'approved').length // Mukofotlar = tasdiqlangan vazifalar
        };
        
        return {
          ...apprentice,
          stats
        };
      })
    );
    
    res.json({ users: apprenticesWithStats });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, username, password, phone, percentage, profileImage, profession, experience } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Check if phone is taken by another user
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone && existingPhone._id.toString() !== id) {
        return res.status(400).json({ message: 'Bu telefon raqam allaqachon band' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (username) user.username = username;
    if (password) user.password = password;
    if (phone !== undefined) user.phone = phone.trim() || undefined;
    if (percentage !== undefined) user.percentage = percentage;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (profession !== undefined) user.profession = profession;
    if (experience !== undefined) user.experience = experience;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        role: user.role,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all tasks assigned to this user
    const Task = require('../models/Task').default;
    await Task.deleteMany({ assignedTo: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({ message: 'User and related tasks deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


