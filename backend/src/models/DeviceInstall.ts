import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceInstall extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceFingerprint: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
  };
  installCount: number;
  lastInstallDate: Date;
  isBlocked: boolean;
  installHistory: Array<{
    installedAt: Date;
    ipAddress: string;
    location?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceInstallSchema = new Schema<IDeviceInstall>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      index: true
    },
    deviceFingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceInfo: {
      userAgent: { type: String, required: true },
      platform: { type: String, required: true },
      language: { type: String, required: true },
      screenResolution: { type: String, required: true },
      timezone: { type: String, required: true }
    },
    installCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    lastInstallDate: {
      type: Date,
      default: Date.now
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    installHistory: [
      {
        installedAt: { type: Date, default: Date.now },
        ipAddress: { type: String, required: true },
        location: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for user + device
DeviceInstallSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// Method to check if device can install
DeviceInstallSchema.methods.canInstall = function(): boolean {
  return !this.isBlocked && this.installCount < 5;
};

// Method to increment install count
DeviceInstallSchema.methods.recordInstall = async function(ipAddress: string): Promise<void> {
  this.installCount += 1;
  this.lastInstallDate = new Date();
  
  this.installHistory.push({
    installedAt: new Date(),
    ipAddress
  });

  if (this.installCount >= 5) {
    this.isBlocked = true;
  }

  await this.save();
};

export default mongoose.model<IDeviceInstall>('DeviceInstall', DeviceInstallSchema);
