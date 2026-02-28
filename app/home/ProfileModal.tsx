"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Mail, Briefcase, Building2 } from "lucide-react";

interface ProfileModalProps {
  user?: {
    name: string;
    email: string;
    role: string;
    department?: string;
    avatar?: string;
  };
}

export default function ProfileModal({ user }: ProfileModalProps) {
  const userData = user || {
    name: "John Doe",
    email: "john.doe@issuelane.com",
    role: "Product Manager",
    department: "Engineering",
    avatar: "JD",
  };

  const profileItems = [
    { icon: Mail, label: "Email", value: userData.email },
    { icon: Briefcase, label: "Role", value: userData.role },
    { icon: Building2, label: "Department", value: userData.department },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
          <User className="w-4 h-4" />
          Profile
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {userData.avatar}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-gray-900">
              {userData.name}
            </h2>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {profileItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <item.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}