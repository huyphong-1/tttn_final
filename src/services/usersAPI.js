// src/services/api/usersAPI.js
import { supabase } from "../../lib/supabase";

/**
 * usersAPI: thao tác với bảng public.profiles
 * - getMyProfile(userId): lấy profile theo id
 * - updateUserProfile(userId, payload): update các field cho phép
 *
 * Lưu ý:
 * - DB nên có trigger auto-update updated_at (không cần gửi updated_at từ client)
 * - RLS: user chỉ update được row có id = auth.uid()
 */
export const usersAPI = {
  async getMyProfile(userId) {
    if (!userId) throw new Error("Missing userId");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId, payload) {
    if (!userId) throw new Error("Missing userId");

    // Chỉ cho phép update các field mà UI đang dùng
    const allowed = ((p) => ({
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      address: p.address ?? null,
      city: p.city ?? null,
      avatar_url: p.avatar_url ?? null,
      date_of_birth: p.date_of_birth || null, // date string: "YYYY-MM-DD"
      gender: p.gender ?? null
    }))(payload || {});

    // (Optional) dọn chuỗi rỗng => null để DB đỡ chứa ""
    Object.keys(allowed).forEach((k) => {
      if (allowed[k] === "") allowed[k] = null;
    });

    const { data, error } = await supabase
      .from("profiles")
      .update(allowed)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
};

export default usersAPI;
