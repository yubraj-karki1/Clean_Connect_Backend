// This utility helps to get the image path and delete images if needed
import path from 'path';
import fs from 'fs';

export const getProfileImagePath = (filename: string) => {
  return path.join('uploads', 'profile', filename);
};

export const deleteProfileImage = (filename: string) => {
  const filePath = getProfileImagePath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};
