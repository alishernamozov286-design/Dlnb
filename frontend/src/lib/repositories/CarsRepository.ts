/**
 * Cars Repository - Cars specific CRUD operations (FIXED)
 * 
 * BaseRepository'dan meros olib, cars uchun maxsus logikani implement qiladi
 */

import { BaseRepository } from '@/lib/repositories/BaseRepository';
import { Car, CarPart, ServiceItem } from '@/lib/types/base';
import { ValidationError } from '@/lib/utils/errors';

export class CarsRepository extends BaseRepository<Car> {
  constructor() {
    super({
      collection: 'cars',
      singularName: 'car',
      useSoftDelete: true,
      validation: {
        required: ['make', 'carModel', 'licensePlate', 'ownerName', 'ownerPhone'],
        optional: ['year', 'status', 'paymentStatus', 'parts', 'serviceItems']
      }
    });
  }

  protected getApiEndpoint(): string {
    return '/cars'; // BASE_URL already includes /api
  }

  protected validateCreate(data: Omit<Car, '_id'>): void {
    const errors: string[] = [];

    // Required fields
    if (!data.make?.trim()) errors.push('Make is required');
    if (!data.carModel?.trim()) errors.push('Car model is required');
    if (!data.licensePlate?.trim()) errors.push('License plate is required');
    if (!data.ownerName?.trim()) errors.push('Owner name is required');
    if (!data.ownerPhone?.trim()) errors.push('Owner phone is required');

    // Phone validation
    if (data.ownerPhone && !this.isValidPhone(data.ownerPhone)) {
      errors.push('Invalid phone number format');
    }

    // Year validation
    if (data.year && (data.year < 1900 || data.year > new Date().getFullYear() + 1)) {
      errors.push('Invalid year');
    }

    // Parts validation
    if (data.parts) {
      this.validateParts(data.parts);
    }

    // Service items validation
    if (data.serviceItems) {
      this.validateServiceItems(data.serviceItems);
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '), 'validation', data);
    }
  }

  protected validateUpdate(data: Partial<Car>): void {
    const errors: string[] = [];

    // Optional field validation
    if (data.make !== undefined && !data.make?.trim()) {
      errors.push('Make cannot be empty');
    }
    
    if (data.carModel !== undefined && !data.carModel?.trim()) {
      errors.push('Car model cannot be empty');
    }
    
    if (data.licensePlate !== undefined && !data.licensePlate?.trim()) {
      errors.push('License plate cannot be empty');
    }
    
    if (data.ownerName !== undefined && !data.ownerName?.trim()) {
      errors.push('Owner name cannot be empty');
    }
    
    if (data.ownerPhone !== undefined) {
      if (!data.ownerPhone?.trim()) {
        errors.push('Owner phone cannot be empty');
      } else if (!this.isValidPhone(data.ownerPhone)) {
        errors.push('Invalid phone number format');
      }
    }

    if (data.year !== undefined && (data.year < 1900 || data.year > new Date().getFullYear() + 1)) {
      errors.push('Invalid year');
    }

    if (data.parts) {
      this.validateParts(data.parts);
    }

    if (data.serviceItems) {
      this.validateServiceItems(data.serviceItems);
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '), 'validation', data);
    }
  }

  protected transformForServer(data: any): any {
    const cleanData = { ...data };

    // Remove client-side fields
    delete cleanData._id;
    delete cleanData._pending;
    delete cleanData._lastModified;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    delete cleanData.__v;

    // Ensure required fields have default values
    cleanData.make = cleanData.make?.trim() || 'Unknown';
    cleanData.carModel = cleanData.carModel?.trim() || 'Unknown';
    cleanData.year = Number(cleanData.year) || new Date().getFullYear();
    cleanData.licensePlate = cleanData.licensePlate?.trim() || `TEMP-${Date.now()}`;
    cleanData.ownerName = cleanData.ownerName?.trim() || 'Unknown Client';
    cleanData.ownerPhone = cleanData.ownerPhone?.trim() || '+998000000000';

    // Ensure arrays exist
    cleanData.parts = Array.isArray(cleanData.parts) ? cleanData.parts : [];
    cleanData.serviceItems = Array.isArray(cleanData.serviceItems) ? cleanData.serviceItems : [];

    // Clean parts array
    cleanData.parts = cleanData.parts
      .filter((part: CarPart) => 
        part && 
        part.name?.trim() && 
        typeof part.quantity === 'number' && part.quantity > 0 &&
        typeof part.price === 'number' && part.price >= 0
      )
      .map((part: CarPart) => ({
        name: String(part.name).trim(),
        quantity: Number(part.quantity),
        price: Number(part.price),
        status: part.status || 'needed'
      }));

    // Clean service items array
    cleanData.serviceItems = cleanData.serviceItems
      .filter((item: ServiceItem) => 
        item && 
        item.name?.trim() && 
        typeof item.quantity === 'number' && item.quantity > 0 &&
        typeof item.price === 'number' && item.price >= 0 &&
        ['part', 'material', 'labor'].includes(item.category)
      )
      .map((item: ServiceItem) => ({
        name: String(item.name).trim(),
        description: String(item.description || '').trim(),
        quantity: Number(item.quantity),
        price: Number(item.price),
        category: item.category
      }));

    // Remove soft delete fields for server
    delete cleanData.isDeleted;
    delete cleanData.deletedAt;

    return cleanData;
  }

  // Cars specific methods
  async getActiveCars(): Promise<Car[]> {
    const allCars = await this.getAll();
    return allCars.filter(car => !car.isDeleted);
  }

  async getCarsByStatus(status: Car['status']): Promise<Car[]> {
    const cars = await this.getActiveCars();
    return cars.filter(car => car.status === status);
  }

  async getCarsByPaymentStatus(paymentStatus: Car['paymentStatus']): Promise<Car[]> {
    const cars = await this.getActiveCars();
    return cars.filter(car => car.paymentStatus === paymentStatus);
  }

  async searchCars(query: string): Promise<Car[]> {
    const cars = await this.getActiveCars();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return cars;
    
    return cars.filter(car => 
      car.make.toLowerCase().includes(searchTerm) ||
      car.carModel.toLowerCase().includes(searchTerm) ||
      car.licensePlate.toLowerCase().includes(searchTerm) ||
      car.ownerName.toLowerCase().includes(searchTerm) ||
      car.ownerPhone.includes(searchTerm)
    );
  }

  async updateCarStatus(id: string, status: Car['status']): Promise<Car> {
    return this.update(id, { status });
  }

  async updatePaymentStatus(id: string, paymentStatus: Car['paymentStatus'], paidAmount?: number): Promise<Car> {
    const updateData: Partial<Car> = { paymentStatus };
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }
    return this.update(id, updateData);
  }

  async addPart(id: string, part: CarPart): Promise<Car> {
    const car = await this.storage.getById<Car>(this.config.collection, id);
    if (!car) {
      throw new ValidationError('Car not found', '_id', id);
    }

    const updatedParts = [...(car.parts || []), part];
    return this.update(id, { parts: updatedParts });
  }

  async updatePart(id: string, partIndex: number, partUpdate: Partial<CarPart>): Promise<Car> {
    const car = await this.storage.getById<Car>(this.config.collection, id);
    if (!car) {
      throw new ValidationError('Car not found', '_id', id);
    }

    const updatedParts = [...(car.parts || [])];
    if (partIndex >= 0 && partIndex < updatedParts.length) {
      updatedParts[partIndex] = { ...updatedParts[partIndex], ...partUpdate };
    }

    return this.update(id, { parts: updatedParts });
  }

  async removePart(id: string, partIndex: number): Promise<Car> {
    const car = await this.storage.getById<Car>(this.config.collection, id);
    if (!car) {
      throw new ValidationError('Car not found', '_id', id);
    }

    const updatedParts = [...(car.parts || [])];
    if (partIndex >= 0 && partIndex < updatedParts.length) {
      updatedParts.splice(partIndex, 1);
    }

    return this.update(id, { parts: updatedParts });
  }

  // Private validation helpers
  private isValidPhone(phone: string): boolean {
    // Uzbekistan phone number validation
    const phoneRegex = /^(\+998|998|8)?[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private validateParts(parts: CarPart[]): void {
    if (!Array.isArray(parts)) {
      throw new ValidationError('Parts must be an array', 'parts', parts);
    }

    parts.forEach((part, index) => {
      if (!part.name?.trim()) {
        throw new ValidationError(`Part ${index + 1}: name is required`, `parts[${index}].name`, part.name);
      }
      
      if (typeof part.quantity !== 'number' || part.quantity <= 0) {
        throw new ValidationError(`Part ${index + 1}: quantity must be a positive number`, `parts[${index}].quantity`, part.quantity);
      }
      
      if (typeof part.price !== 'number' || part.price < 0) {
        throw new ValidationError(`Part ${index + 1}: price must be a non-negative number`, `parts[${index}].price`, part.price);
      }
      
      if (part.status && !['needed', 'ordered', 'received', 'installed'].includes(part.status)) {
        throw new ValidationError(`Part ${index + 1}: invalid status`, `parts[${index}].status`, part.status);
      }
    });
  }

  private validateServiceItems(serviceItems: ServiceItem[]): void {
    if (!Array.isArray(serviceItems)) {
      throw new ValidationError('Service items must be an array', 'serviceItems', serviceItems);
    }

    serviceItems.forEach((item, index) => {
      if (!item.name?.trim()) {
        throw new ValidationError(`Service item ${index + 1}: name is required`, `serviceItems[${index}].name`, item.name);
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new ValidationError(`Service item ${index + 1}: quantity must be a positive number`, `serviceItems[${index}].quantity`, item.quantity);
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        throw new ValidationError(`Service item ${index + 1}: price must be a non-negative number`, `serviceItems[${index}].price`, item.price);
      }
      
      if (!['part', 'material', 'labor'].includes(item.category)) {
        throw new ValidationError(`Service item ${index + 1}: invalid category`, `serviceItems[${index}].category`, item.category);
      }
    });
  }
}

// Singleton instance
export const carsRepository = new CarsRepository();