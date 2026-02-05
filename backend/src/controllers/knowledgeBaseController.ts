import { Response } from 'express';
import KnowledgeBase from '../models/KnowledgeBase';
import { AuthRequest } from '../middleware/auth';
// Create knowledge entry
export const createKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { carModel, problem, solution, category, tags } = req.body;
    if (!carModel || !problem || !solution) {
      return res.status(400).json({ 
        message: 'Mashina modeli, muammo va yechim majburiy' 
      });
    }
    const knowledge = new KnowledgeBase({
      master: req.user?._id,
      carModel: carModel.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      category: category || 'boshqa',
      tags: tags || []
    });
    await knowledge.save();
    res.status(201).json({
      success: true,
      message: 'Bilim muvaffaqiyatli qo\'shildi',
      knowledge
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Bilim qo\'shishda xatolik',
      error: error.message 
    });
  }
};
// Get all knowledge entries for master
export const getKnowledgeList = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search } = req.query;
    const query: any = { 
      master: req.user?._id,
      isActive: true 
    };
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search as string };
    }
    const knowledge = await KnowledgeBase.find(query)
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      knowledge,
      count: knowledge.length
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Bilimlarni olishda xatolik',
      error: error.message 
    });
  }
};
// Update knowledge entry
export const updateKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { carModel, problem, solution, category, tags, isActive } = req.body;
    const knowledge = await KnowledgeBase.findOne({
      _id: id,
      master: req.user?._id
    });
    if (!knowledge) {
      return res.status(404).json({ message: 'Bilim topilmadi' });
    }
    if (carModel) knowledge.carModel = carModel.trim();
    if (problem) knowledge.problem = problem.trim();
    if (solution) knowledge.solution = solution.trim();
    if (category) knowledge.category = category;
    if (tags) knowledge.tags = tags;
    if (typeof isActive === 'boolean') knowledge.isActive = isActive;
    await knowledge.save();
    res.json({
      success: true,
      message: 'Bilim yangilandi',
      knowledge
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Bilimni yangilashda xatolik',
      error: error.message 
    });
  }
};
// Delete knowledge entry
export const deleteKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const knowledge = await KnowledgeBase.findOneAndDelete({
      _id: id,
      master: req.user?._id
    });
    if (!knowledge) {
      return res.status(404).json({ message: 'Bilim topilmadi' });
    }
    res.json({
      success: true,
      message: 'Bilim o\'chirildi'
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Bilimni o\'chirishda xatolik',
      error: error.message 
    });
  }
};
// Search knowledge (for AI chat)
export const searchKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { query, masterId } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Qidiruv so\'rovi kerak' });
    }
    const searchQuery: any = {
      isActive: true,
      $text: { $search: query as string }
    };
    if (masterId) {
      searchQuery.master = masterId;
    }
    const results = await KnowledgeBase.find(searchQuery)
      .select('carModel problem solution category')
      .limit(5)
      .lean();
    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Qidirishda xatolik',
      error: error.message 
    });
  }
};
