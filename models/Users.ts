import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  first_name: String,
  last_name: String,
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
