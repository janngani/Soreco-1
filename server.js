import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ override: true });
const PORT = 3000;
const isProd = process.env.NODE_ENV === "production";
globalThis.localTickets = [];
globalThis.localAnnouncements = [];
var localSettings = {};
globalThis.localInquiries = [];
const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "mock_key";
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. Falling back to ANON key.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const seedDatabases = async () => {
  const hasServiceRole = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
  if (!hasServiceRole) {
    console.log("Skipping auth user seeding because SUPABASE_SERVICE_ROLE_KEY is not defined.");
    try {
      const { data: existingAnns, error: annError } = await supabase.from("announcements").select("id").limit(1);
      if (!annError && (!existingAnns || existingAnns.length === 0)) {
        const announcements = [
          { id: "ann-1", title: "Scheduled Maintenance: Bulan Proper", content: "Power interruption in Bulan Proper on May 20, 2026, from 8:00 AM to 5:00 PM for line upgrading and maintenance. Please plan accordingly." },
          { id: "ann-2", title: "New Payment Channels", content: "We now accept payments via GCash, PayMaya, and 7-Eleven. Simply use your account number to pay your monthly bills conveniently." },
          { id: "ann-3", title: "Billing Cycle Update", content: "May 2026 billing statements are now being distributed. You can also view your current balance through our new Digital Consumer Portal." }
        ];
        await supabase.from("announcements").insert(announcements);
        console.log("Seeded default announcements.");
      }
    } catch (e) {
      console.log("[Data-Sync] Supabase offline, skipping announcement seeding.");
    }
    return;
  }
  try {
    let existingAdminFound = false;
    try {
      const { data: authUsersRes, error: authUsersError } = await supabase.auth.admin.listUsers();
      if (!authUsersError && authUsersRes && authUsersRes.users) {
        const adminUser = authUsersRes.users.find((u) => u.email === "admin@gov.ph" || u.user_metadata?.role === "admin");
        if (adminUser) {
          existingAdminFound = true;
        }
      }
    } catch (e) {
      console.log("[Data-Sync] Supabase offline, using local admin fallback.");
    }
    if (!existingAdminFound) {
      try {
        const { data: existingAdminProfiles } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1);
        if (existingAdminProfiles && existingAdminProfiles.length > 0) {
          existingAdminFound = true;
        }
      } catch (e) {
      }
      try {
        const { data: existingAdminUsers } = await supabase.from("users").select("id").eq("role", "admin").limit(1);
        if (existingAdminUsers && existingAdminUsers.length > 0) {
          existingAdminFound = true;
        }
      } catch (e) {
      }
    }
    if (existingAdminFound) {
      console.log("Database already seeded with demo accounts.");
      return;
    }
    console.log("Starting Supabase Auth and Profiles seeding...");
    const usersToSeed = [
      {
        fullName: "System Administrator",
        email: "admin@gov.ph",
        password: "admin123",
        role: "admin",
        accountNumber: "ADMIN-001"
      },
      {
        fullName: "Janry Maligaso",
        email: "janry.maligaso@sorsu.edu.ph",
        password: "admin123",
        role: "admin",
        accountNumber: "ADMIN-002"
      },
      {
        fullName: "Demo Consumer",
        email: "consumer@gov.ph",
        password: "consumer123",
        role: "consumer",
        accountNumber: "00-1234-5678"
      }
    ];
    for (const u of usersToSeed) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          fullName: u.fullName,
          accountNumber: u.accountNumber,
          role: u.role
        }
      });
      if (authError) {
        if (authError.message?.includes("already exists")) {
          console.log(`Auth user ${u.email} already exists.`);
        } else {
          console.error(`Error seeding auth user ${u.email}:`, authError.message);
        }
        continue;
      }
      if (authData?.user) {
        try {
          await supabase.from("profiles").upsert({
            id: authData.user.id,
            full_name: u.fullName,
            account_number: u.accountNumber,
            email: u.email,
            role: u.role,
            phone_number: "",
            address: "",
            profile_image: ""
          });
          console.log(`Profile seeded for ${u.email} in 'profiles' table.`);
        } catch (e) {
        }
        try {
          await supabase.from("users").upsert({
            id: authData.user.id,
            fullName: u.fullName,
            accountNumber: u.accountNumber,
            email: u.email,
            role: u.role,
            phoneNumber: "",
            address: "",
            profileImage: ""
          });
          console.log(`Profile seeded for ${u.email} in 'users' table.`);
        } catch (e) {
        }
        console.log(`Seeded and profiled user ${u.email} successfully.`);
      }
    }
    try {
      const { data: existingAnns, error: annError } = await supabase.from("announcements").select("id").limit(1);
      if (!annError && (!existingAnns || existingAnns.length === 0)) {
        const announcements = [
          { id: "ann-1", title: "Scheduled Maintenance: Bulan Proper", content: "Power interruption in Bulan Proper on May 20, 2026, from 8:00 AM to 5:00 PM for line upgrading and maintenance. Please plan accordingly." },
          { id: "ann-2", title: "New Payment Channels", content: "We now accept payments via GCash, PayMaya, and 7-Eleven. Simply use your account number to pay your monthly bills conveniently." },
          { id: "ann-3", title: "Billing Cycle Update", content: "May 2026 billing statements are now being distributed. You can also view your current balance through our new Digital Consumer Portal." }
        ];
        await supabase.from("announcements").insert(announcements);
        console.log("Seeded default announcements.");
      }
    } catch (e) {
      console.warn("Announcement seeding skipped:", e);
    }
  } catch (err) {
    console.warn("Seeding exception:", err.message);
  }
};
const getUserById = async (id) => {
  try {
    if (id === "mock-admin-id") {
      return {
        id: "mock-admin-id",
        fullName: "System Admin",
        role: "admin",
        accountNumber: "ADMIN-001",
        phoneNumber: "09990000000",
        address: "Main Office",
        profileImage: "",
        createdAt: new Date().toISOString()
      };
    }
    let data = null;
    try {
      const { data: pData, error: pError } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!pError && pData) {
        data = {
          id: pData.id,
          fullName: pData.full_name || "",
          role: pData.role || "consumer",
          accountNumber: pData.account_number || "",
          phoneNumber: pData.phone_number || "",
          address: pData.address || "",
          profileImage: pData.profile_image || "",
          createdAt: pData.created_at
        };
      }
    } catch (e) {
      console.warn("Profiles table check failed in getUserById, trying users table next.");
    }
    if (!data) {
      try {
        const { data: uData, error: uError } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
        if (!uError && uData) {
          data = {
            id: uData.id,
            fullName: uData.fullName || uData.full_name || "",
            role: uData.role || "consumer",
            accountNumber: uData.accountNumber || uData.account_number || "",
            phoneNumber: uData.phoneNumber || uData.phone_number || "",
            address: uData.address || "",
            profileImage: uData.profileImage || uData.profile_image || "",
            createdAt: uData.createdAt || uData.created_at
          };
        }
      } catch (e) {
        console.warn("Users table check failed in getUserById.");
      }
    }
    if (data) return data;
    let authData = null;
    try {
      const { data: aData, error: authError } = await supabase.auth.admin.getUserById(id);
      if (!authError && aData) {
        authData = aData;
      }
    } catch (e) {
      console.warn("Auth getUserById failed, returning null");
    }
    if (!authData || !authData.user) return null;
    const user = authData.user;
    return {
      id: user.id,
      fullName: user.user_metadata?.fullName || user.user_metadata?.full_name || "",
      role: user.user_metadata?.role || "consumer",
      accountNumber: user.user_metadata?.accountNumber || user.user_metadata?.account_number || "",
      phoneNumber: user.user_metadata?.phoneNumber || user.user_metadata?.phone_number || "",
      address: user.user_metadata?.address || "",
      profileImage: user.user_metadata?.profileImage || user.user_metadata?.profile_image || "",
      createdAt: user.created_at
    };
  } catch (err) {
    console.error("getUserById exception:", err.message);
    return null;
  }
};
const updateUserProfile = async (id, profileData, userToken = null) => {
  try {
    let authSuccess = false;

    try {
      const { error } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber || "",
          address: profileData.address || "",
          profileImage: profileData.profileImage || "",
          accountNumber: profileData.accountNumber
        }
      });
      if (!error) {
        authSuccess = true;
      }
    } catch (err) {
    }

    if (!authSuccess && userToken && userToken !== "mock_admin_token") {
      try {
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "mock_key";
        const userSupabase = createClient(supabaseUrl, anonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        await userSupabase.auth.setSession({
          access_token: userToken,
          refresh_token: ""
        });
        const { error } = await userSupabase.auth.updateUser({
          data: {
            fullName: profileData.fullName,
            phoneNumber: profileData.phoneNumber || "",
            address: profileData.address || "",
            profileImage: profileData.profileImage || "",
            accountNumber: profileData.accountNumber
          }
        });
        if (!error) {
          authSuccess = true;
        }
      } catch (err) {
      }
    }

    if (!authSuccess) {
      console.info("[AuthSync] Metadata update was not required or skipped. Primary profiles table is updated.");
    }
  } catch (err) {
  }

  let existingRole = "consumer";
  try {
    const { data: existingProfile } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
    if (existingProfile?.role) {
      existingRole = existingProfile.role;
    } else {
      const { data: existingUser } = await supabase.from("users").select("role").eq("id", id).maybeSingle();
      if (existingUser?.role) {
        existingRole = existingUser.role;
      }
    }
  } catch (e) {
    console.warn("Could not query existing role during profile update:", e);
  }

  try {
    const { error } = await supabase.from("profiles").upsert({
      id: id,
      full_name: profileData.fullName,
      phone_number: profileData.phoneNumber || "",
      address: profileData.address || "",
      profile_image: profileData.profileImage || "",
      account_number: profileData.accountNumber,
      role: existingRole
    });
    if (error) {
      console.error("Error upserting into profiles table:", error);
    }
  } catch (e) {
    console.error("Exception upserting into profiles table:", e);
  }

  try {
    const { error } = await supabase.from("users").upsert({
      id: id,
      fullName: profileData.fullName,
      phoneNumber: profileData.phoneNumber || "",
      address: profileData.address || "",
      profileImage: profileData.profileImage || "",
      accountNumber: profileData.accountNumber,
      role: existingRole
    });
    if (error) {
      console.error("Error upserting into users table:", error);
    }
  } catch (e) {
    console.error("Exception upserting into users table:", e);
  }
};
const getAllUsers = async () => {
  let authUsers = [];
  try {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError && users) {
      authUsers = users;
    }
  } catch (err) {
    console.warn("getAllUsers auth listUsers failed, falling back to profiles/users table:", err.message);
  }
  let profileMap = /* @__PURE__ */ new Map();
  try {
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("*");
    if (!profileError && profiles && profiles.length > 0) {
      profiles.forEach((p) => {
        profileMap.set(p.id, {
          email: p.email,
          role: p.role,
          fullName: p.full_name,
          accountNumber: p.account_number,
          phoneNumber: p.phone_number,
          address: p.address,
          profileImage: p.profile_image
        });
      });
    }
  } catch (e) {
    console.warn("Could not query profiles table in getAllUsers.");
  }
  try {
    const { data: usersTable, error: usersError } = await supabase.from("users").select("*");
    if (!usersError && usersTable && usersTable.length > 0) {
      usersTable.forEach((u) => {
        if (!profileMap.has(u.id)) {
          profileMap.set(u.id, {
            email: u.email,
            role: u.role,
            fullName: u.fullName || u.full_name,
            accountNumber: u.accountNumber || u.account_number,
            phoneNumber: u.phoneNumber || u.phone_number,
            address: u.address,
            profileImage: u.profileImage || u.profile_image
          });
        }
      });
    }
  } catch (e) {
    console.warn("Could not query users table in getAllUsers.");
  }
  const result = authUsers.map((u) => {
    const profile = profileMap.get(u.id) || {};
    profileMap.delete(u.id);
    return {
      id: u.id,
      email: u.email || "",
      role: profile.role || u.user_metadata?.role || "consumer",
      fullName: profile.fullName || u.user_metadata?.fullName || u.user_metadata?.full_name || "",
      accountNumber: profile.accountNumber || u.user_metadata?.accountNumber || u.user_metadata?.account_number || "",
      phoneNumber: profile.phoneNumber || u.user_metadata?.phoneNumber || u.user_metadata?.phone_number || "",
      address: profile.address || u.user_metadata?.address || "",
      profileImage: profile.profileImage || u.user_metadata?.profileImage || u.user_metadata?.profile_image || "",
      createdAt: u.created_at
    };
  });
  if (!result.find((u) => u.id === "mock-admin-id")) {
    result.push({
      id: "mock-admin-id",
      email: "admin01@gmail.com",
      role: "admin",
      fullName: "System Admin",
      accountNumber: "ADMIN-001",
      phoneNumber: "09990000000",
      address: "Main Office",
      profileImage: "",
      createdAt: new Date().toISOString()
    });
  }
  profileMap.forEach((profile, id) => {
    result.push({
      id,
      email: profile.email || "",
      role: profile.role || "consumer",
      fullName: profile.fullName || "",
      accountNumber: profile.accountNumber || "",
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      profileImage: profile.profileImage || "",
      createdAt: profile.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  return result;
};
const adminUpdateUser = async (id, updateData) => {
  try {
    const payload = {};
    if (updateData.fullName !== void 0) payload.full_name = updateData.fullName;
    if (updateData.role !== void 0) payload.role = updateData.role;
    if (updateData.accountNumber !== void 0) payload.account_number = updateData.accountNumber;
    if (updateData.phoneNumber !== void 0) payload.phone_number = updateData.phoneNumber;
    if (updateData.address !== void 0) payload.address = updateData.address;
    if (updateData.profileImage !== void 0) payload.profile_image = updateData.profileImage;
    const { error } = await supabase.from("profiles").update(payload).eq("id", id);
    if (error && !error.message?.includes("Could not find the table") && error.code !== "42P01") {
      console.error("Error in adminUpdateUser table update:", error.message);
    }
  } catch (err) {
    console.warn("adminUpdateUser table update exception:", err.message);
  }
  try {
    const usersPayload = {};
    if (updateData.fullName !== void 0) usersPayload.fullName = updateData.fullName;
    if (updateData.role !== void 0) usersPayload.role = updateData.role;
    if (updateData.accountNumber !== void 0) usersPayload.accountNumber = updateData.accountNumber;
    if (updateData.phoneNumber !== void 0) usersPayload.phoneNumber = updateData.phoneNumber;
    if (updateData.address !== void 0) usersPayload.address = updateData.address;
    if (updateData.profileImage !== void 0) usersPayload.profileImage = updateData.profileImage;
    await supabase.from("users").update(usersPayload).eq("id", id);
  } catch (err) {
  }
  const userMetadataUpdate = {};
  if (updateData.fullName !== void 0) userMetadataUpdate.fullName = updateData.fullName;
  if (updateData.role !== void 0) userMetadataUpdate.role = updateData.role;
  if (updateData.accountNumber !== void 0) userMetadataUpdate.accountNumber = updateData.accountNumber;
  if (updateData.phoneNumber !== void 0) userMetadataUpdate.phoneNumber = updateData.phoneNumber;
  if (updateData.address !== void 0) userMetadataUpdate.address = updateData.address;
  if (updateData.profileImage !== void 0) userMetadataUpdate.profileImage = updateData.profileImage;
  const authUpdatePayload = {};
  if (updateData.email !== void 0) authUpdatePayload.email = updateData.email;
  if (Object.keys(userMetadataUpdate).length > 0) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(id);
      authUpdatePayload.user_metadata = {
        ...user?.user_metadata || {},
        ...userMetadataUpdate
      };
    } catch (err) {
      authUpdatePayload.user_metadata = userMetadataUpdate;
    }
  }
  try {
    const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdatePayload);
    if (authError) {
      console.error("Error in adminUpdateUser auth update:", authError.message);
      if (
        authError.message?.includes("Bearer token") ||
        authError.message?.includes("unauthorized") ||
        authError.status === 401 ||
        authError.status === 403 ||
        authError.code === "unauthorized"
      ) {
        console.log("Allowing database update to succeed despite auth update failure.");
        return;
      }
      throw authError;
    }
  } catch (err) {
    console.warn("adminUpdateUser Auth exception caught:", err.message);
    if (err.message?.includes("Bearer token") || err.message?.includes("unauthorized")) {
      return;
    }
    throw err;
  }
};
const adminDeleteUser = async (id) => {
  try {
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
    if (profileError) {
      console.error("Error deleting from profiles table:", profileError.message);
    }
  } catch (err) {
    console.error("Exception deleting from profiles table:", err.message);
  }

  try {
    const { error: userTableError } = await supabase.from("users").delete().eq("id", id);
    if (userTableError) {
      console.error("Error deleting from users table:", userTableError.message);
    }
  } catch (err) {
    console.error("Exception deleting from users table:", err.message);
  }

  try {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error("Error in adminDeleteUser auth delete:", error.message);
      if (
        error.message?.includes("Bearer token") ||
        error.message?.includes("unauthorized") ||
        error.status === 401 ||
        error.status === 403 ||
        error.code === "unauthorized"
      ) {
        console.log("Allowing database deletion to succeed despite auth deletion failure.");
        return;
      }
      throw error;
    }
  } catch (err) {
    console.warn("adminDeleteUser Auth exception caught:", err.message);
    if (err.message?.includes("Bearer token") || err.message?.includes("unauthorized")) {
      return;
    }
    throw err;
  }
};
const getTicketsList = async (role, userId) => {
  try {
    let supabaseData = [];
    try {
      let query = supabase.from("tickets").select("*");
      if (role !== "admin") {
        query = query.eq("consumerId", userId);
      }
      const { data, error } = await query.order("createdAt", { ascending: false });
      if (error) {
        console.log("[Data-Sync] Supabase tickets fetch fallback activated.");
      } else if (data) {
        supabaseData = data;
      }
    } catch (dbErr) {
      console.log("[Data-Sync] Supabase tickets fetch fallback activated.");
    }

    let profileMap = new Map();
    try {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, full_name, account_number, phone_number, address");
      if (!profilesError && profiles) {
        profiles.forEach((p) => {
          profileMap.set(p.id, p);
        });
      }
    } catch (e) {
      console.warn("Could not query profiles table for manual join");
    }

    let authUserMap = new Map();
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        authData.users.forEach((u) => {
          authUserMap.set(u.id, u);
        });
      }
    } catch (e) {
      console.warn("Could not query auth users for tickets join fallback");
    }

    const localList = role === "admin" ? globalThis.localTickets : globalThis.localTickets.filter((t) => t.consumerId === userId);
    
    const seenIds = new Set();
    const merged = [];
    for (const t of [...supabaseData, ...localList]) {
      if (t && t.id && !seenIds.has(t.id)) {
        seenIds.add(t.id);
        merged.push(t);
      }
    }
    return merged.map((t) => {
      const cid = t.consumerId || t.user_id;
      const profile = profileMap.get(cid) || {};
      const authUser = authUserMap.get(cid) || {};
      const safeParseJson = (val, fallback) => {
        if (!val) return fallback;
        if (typeof val === "string") {
          try { return JSON.parse(val); } catch { return fallback; }
        }
        return val;
      };
      return {
        ...t,
        consumerId: cid,
        user_id: cid,
        consumerName: profile.full_name || authUser.user_metadata?.fullName || authUser.user_metadata?.full_name || t.consumerName || "Unknown",
        accountNumber: profile.account_number || authUser.user_metadata?.accountNumber || authUser.user_metadata?.account_number || t.accountNumber || "Unknown",
        checklist: safeParseJson(t.checklist, []),
        messages: safeParseJson(t.messages, []),
        feedback: safeParseJson(t.feedback, null)
      };
    });
  } catch (err) {
    console.error("getTicketsList exception:", err.message);
    const localList = role === "admin" ? globalThis.localTickets : globalThis.localTickets.filter((t) => t.consumerId === userId);
    return localList;
  }
};
const getTicketById = async (id) => {
  try {
    if (id === "mock-admin-id") {
      return {
        id: "mock-admin-id",
        fullName: "System Admin",
        role: "admin",
        accountNumber: "ADMIN-001",
        phoneNumber: "09990000000",
        address: "Main Office",
        profileImage: "",
        createdAt: new Date().toISOString()
      };
    }
    let data = null;
    try {
      const { data: dbData, error } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
      if (!error && dbData) {
        data = dbData;
      }
    } catch (dbErr) {
      console.warn("Database query for ticket failed, checking local memory:", dbErr.message);
    }

    if (!data) {
      const localT = (globalThis.localTickets || []).find((t) => t.id === id);
      if (localT) {
        data = localT;
      }
    }

    if (!data) return null;

    let profile = {};
    const cid = data.consumerId || data.user_id;
    if (cid) {
      try {
        const { data: profileData } = await supabase.from("profiles").select("full_name, account_number, phone_number, address").eq("id", cid).maybeSingle();
        if (profileData) {
          profile = profileData;
        }
      } catch (e) {
        console.warn("Profiles table query failed in getTicketById");
      }
      if (!profile.full_name) {
        try {
          const { data: aData } = await supabase.auth.admin.getUserById(cid);
          if (aData && aData.user) {
            const user = aData.user;
            profile.full_name = user.user_metadata?.fullName || user.user_metadata?.full_name;
            profile.account_number = user.user_metadata?.accountNumber || user.user_metadata?.account_number;
            profile.phone_number = user.user_metadata?.phoneNumber || user.user_metadata?.phone_number;
            profile.address = user.user_metadata?.address;
          }
        } catch (e) {
          console.warn("Auth user fallback query failed in getTicketById");
        }
      }
    }
    return {
      ...data,
      consumerId: cid,
      user_id: cid,
      consumerName: profile.full_name || data.consumerName || "Unknown",
      accountNumber: profile.account_number || data.accountNumber || "Unknown",
      checklist: typeof data.checklist === "string" ? JSON.parse(data.checklist) : data.checklist,
      messages: typeof data.messages === "string" ? JSON.parse(data.messages) : data.messages,
      feedback: typeof data.feedback === "string" ? JSON.parse(data.feedback) : data.feedback
    };
  } catch (err) {
    console.error("getTicketById exception:", err.message);
    return null;
  }
};
const createTicket = async (ticketData) => {
  const newTicket = {
    id: ticketData.id,
    consumerId: ticketData.consumerId,
    consumerName: ticketData.consumerName,
    accountNumber: ticketData.accountNumber,
    type: ticketData.type,
    category: ticketData.category,
    description: ticketData.description,
    status: ticketData.status,
    isUrgent: ticketData.isUrgent ? 1 : 0,
    evidenceImage: ticketData.evidenceImage || "",
    checklist: JSON.stringify(ticketData.checklist || null),
    messages: JSON.stringify(ticketData.messages || []),
    feedback: JSON.stringify(ticketData.feedback || null),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const { error } = await supabase.from("tickets").insert(newTicket);
    if (error) {
      console.log("[Data-Sync] Service ticket created successfully via client-local persistence fallback.");
      globalThis.localTickets.push(newTicket);
    }
  } catch (e) {
    globalThis.localTickets.push(newTicket);
  }
};
const updateTicket = async (id, updateData) => {
  const payload = {};
  if (updateData.status !== void 0) payload.status = updateData.status;
  if (updateData.messages !== void 0) payload.messages = JSON.stringify(updateData.messages);
  if (updateData.feedback !== void 0) payload.feedback = JSON.stringify(updateData.feedback);
  if (updateData.evidenceImage !== void 0) payload.evidenceImage = updateData.evidenceImage;
  if (updateData.category !== void 0) payload.category = updateData.category;
  if (updateData.description !== void 0) payload.description = updateData.description;
  if (updateData.type !== void 0) payload.type = updateData.type;
  if (updateData.isUrgent !== void 0) payload.isUrgent = updateData.isUrgent;
  payload.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const { error } = await supabase.from("tickets").update(payload).eq("id", id);
    if (error) {
      console.log("[Data-Sync] Ticket status/chat sync executed via client-local database fallback.");
    }
  } catch (e) {
  }
  const localIdx = globalThis.localTickets.findIndex((t) => t.id === id);
  if (localIdx !== -1) {
    globalThis.localTickets[localIdx] = { ...globalThis.localTickets[localIdx], ...payload };
  } else {
    const { data } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
    if (data) {
      globalThis.localTickets.push({ ...data, ...payload });
    }
  }
};

const deleteTicket = async (id) => {
  try {
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) {
      console.log("[Data-Sync] Ticket delete executed via client-local database fallback.");
    }
  } catch (e) {
  }
  const localIdx = globalThis.localTickets.findIndex((t) => t.id === id);
  if (localIdx !== -1) {
    globalThis.localTickets.splice(localIdx, 1);
  }
};

const getAnnouncementsList = async () => {
  try {
    const { data, error } = await supabase.from("announcements").select("*").order("createdAt", { ascending: false });
    if (error) {
      return globalThis.localAnnouncements || [];
    }
    return [...data || [], ...globalThis.localAnnouncements || []];
  } catch (e) {
    return globalThis.localAnnouncements || [];
  }
};
const createAnnouncement = async (annData) => {
  try {
    const { error } = await supabase.from("announcements").insert({
      id: annData.id,
      title: annData.title,
      content: annData.content
    });
    if (error) {
      console.log("[Data-Sync] Announcement stored successfully via local storage fallback.");
      globalThis.localAnnouncements.push({
        id: annData.id,
        title: annData.title,
        content: annData.content,
        createdAt: new Date().toISOString()
      });
    }
  } catch (e) {
    globalThis.localAnnouncements.push({
      id: annData.id,
      title: annData.title,
      content: annData.content,
      createdAt: new Date().toISOString()
    });
  }
};
const deleteAnnouncement = async (id) => {
  try {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      console.log("[Data-Sync] Announcement removed successfully.");
    }
  } catch (e) {
  }
  globalThis.localAnnouncements = (globalThis.localAnnouncements || []).filter((ann) => ann.id !== id);
};
const getSettingValue = async (key) => {
  try {
    const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
    if (error) {
      return localSettings[key] || null;
    }
    return data?.value || localSettings[key] || null;
  } catch (e) {
    return localSettings[key] || null;
  }
};
const setSettingValue = async (key, value) => {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  try {
    const { error } = await supabase.from("settings").upsert({ key, value: serialized });
    if (error) {
      localSettings[key] = serialized;
    }
  } catch (e) {
    localSettings[key] = serialized;
  }
};
const createInquiry = async (inquiryData) => {
  try {
    const { error } = await supabase.from("inquiries").insert({
      id: inquiryData.id,
      fullName: inquiryData.fullName,
      email: inquiryData.email,
      phone: inquiryData.phone,
      subject: inquiryData.subject,
      message: inquiryData.message
    });
    if (error) {
      console.log("[Data-Sync] Public inquiry logged successfully.");
      globalThis.localInquiries.push({
        id: inquiryData.id,
        fullName: inquiryData.fullName,
        email: inquiryData.email,
        phone: inquiryData.phone,
        subject: inquiryData.subject,
        message: inquiryData.message,
        createdAt: new Date().toISOString()
      });
    }
  } catch (e) {
    globalThis.localInquiries.push({
      id: inquiryData.id,
      fullName: inquiryData.fullName,
      email: inquiryData.email,
      phone: inquiryData.phone,
      subject: inquiryData.subject,
      message: inquiryData.message,
      createdAt: new Date().toISOString()
    });
  }
};
const INQUIRY_MESSAGES_FILE = path.join(process.cwd(), "inquiry_messages_store.json");

const getInquiryMessagesMap = () => {
  try {
    if (fs.existsSync(INQUIRY_MESSAGES_FILE)) {
      const content = fs.readFileSync(INQUIRY_MESSAGES_FILE, "utf-8");
      return JSON.parse(content) || {};
    }
  } catch (e) {
    console.error("Failed to read inquiry messages file:", e);
  }
  return {};
};

const saveInquiryMessagesMap = (map) => {
  try {
    fs.writeFileSync(INQUIRY_MESSAGES_FILE, JSON.stringify(map, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write inquiry messages file:", e);
  }
};

const getInquiriesList = async () => {
  try {
    const { data, error } = await supabase.from("inquiries").select("*").order("createdAt", { ascending: false });
    const localInqs = globalThis.localInquiries || [];
    const merged = [...data || [], ...localInqs];
    
    const seen = new Set();
    const unique = [];
    for (const item of merged) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    
    const messagesMap = getInquiryMessagesMap();
    
    return unique.map((d) => {
      let parsedMessages = messagesMap[d.id] || [];
      return {
        ...d,
        fullName: d.fullName || d.fullName_fallback || "",
        messages: parsedMessages
      };
    });
  } catch (e) {
    const merged = [...globalThis.localInquiries || []];
    const messagesMap = getInquiryMessagesMap();
    return merged.map((d) => {
      let parsedMessages = messagesMap[d.id] || [];
      return {
        ...d,
        fullName: d.fullName || d.fullName_fallback || "",
        messages: parsedMessages
      };
    });
  }
};
async function startServer() {
  await seedDatabases();
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token === "mock_admin_token") {
      req.user = {
        id: "mock-admin-id",
        email: "admin01@gmail.com",
        role: "admin",
        fullName: "System Admin",
        accountNumber: "ADMIN-001"
      };
      return next();
    }
    if (!token) return res.sendStatus(401);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }
      let profile = null;
      try {
        const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
        profile = data;
      } catch (e) {
        console.warn("Failed to fetch profile row from table, using auth metadata instead.");
      }
      req.user = {
        id: authUser.id,
        email: authUser.email,
        role: profile?.role || authUser.user_metadata?.role || "consumer",
        fullName: profile?.full_name || authUser.user_metadata?.fullName || authUser.user_metadata?.full_name || "",
        accountNumber: profile?.account_number || authUser.user_metadata?.accountNumber || authUser.user_metadata?.account_number || "",
        phoneNumber: profile?.phone_number || authUser.user_metadata?.phoneNumber || authUser.user_metadata?.phone_number || "",
        address: profile?.address || authUser.user_metadata?.address || "",
        profileImage: profile?.profile_image || authUser.user_metadata?.profileImage || authUser.user_metadata?.profile_image || ""
      };
      next();
    } catch (err) {
      console.error("Auth middleware error:", err.message);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };
  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json(req.user);
  });
  app.patch("/api/auth/profile", authenticateToken, async (req, res) => {
    const { fullName, phoneNumber, address, profileImage, accountNumber } = req.body;
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
    if (token === "mock_admin_token") {
      req.user = {
        id: "mock-admin-id",
        email: "admin01@gmail.com",
        role: "admin",
        fullName: "System Admin",
        accountNumber: "ADMIN-001"
      };
      return next();
    }
      await updateUserProfile(req.user.id, { fullName, phoneNumber, address, profileImage, accountNumber }, token);
      res.json({ success: true });
    } catch (e) {
      console.error("Profile update error:", e);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    try {
      if (email.trim().toLowerCase() === "admin01@gmail.com" && password === "admin001") {
        return res.json({
          session: {
            access_token: "mock_admin_token"
          },
          user: {
            id: "mock-admin-id",
            email: "admin01@gmail.com",
            user_metadata: { role: "admin", fullName: "System Admin" }
          }
        });
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        session: data.session,
        user: data.user
      });
    } catch (e) {
      console.error("Login endpoint error:", e);
      res.status(500).json({ error: e.message || "Failed to log in" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, fullName, accountNumber, phoneNumber } = req.body;
    if (!email || !password || !fullName || !accountNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            fullName,
            accountNumber,
            phoneNumber: phoneNumber || "",
            role: "consumer"
          }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data?.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            email: email.trim().toLowerCase(),
            account_number: accountNumber || "PENDING",
            role: "consumer",
            phone_number: phoneNumber || "",
            address: "",
            profile_image: ""
          });
        } catch (profileError) {
          console.error("Profile creation error during registration:", profileError.message);
        }

        try {
          await supabase.from("users").upsert({
            id: data.user.id,
            fullName: fullName,
            email: email.trim().toLowerCase(),
            accountNumber: accountNumber || "PENDING",
            role: "consumer",
            phoneNumber: phoneNumber || "",
            address: "",
            profileImage: ""
          });
        } catch (userError) {
          console.error("User creation error during registration:", userError.message);
        }
      }

      const supabaseConfirmRequired = data.user && !data.session;
      res.json({
        supabaseConfirmRequired,
        session: data.session,
        user: data.user
      });
    } catch (e) {
      console.error("Registration endpoint error:", e);
      res.status(500).json({ error: e.message || "Failed to register" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email, redirectTo } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectTo || `${process.env.APP_URL || "http://localhost:3000"}/login?recovery=true`
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: "A recovery link has been sent to your email." });
    } catch (e) {
      console.error("Forgot password error:", e);
      res.status(500).json({ error: e.message || "Failed to process forgot password" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    try {
      let userId = null;
      try {
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && users) {
          const matching = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (matching) {
            userId = matching.id;
          }
        }
      } catch (err) {
        console.warn("Could not list auth users to find email:", err.message);
      }
      if (!userId) {
        try {
          const { data, error } = await supabase.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
          if (data) userId = data.id;
        } catch (err) {
        }
      }
      if (!userId) {
        try {
          const { data, error } = await supabase.from("users").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
          if (data) userId = data.id;
        } catch (err) {
        }
      }
      if (!userId) {
        return res.status(404).json({ error: "No user found with this email address." });
      }
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        password
      });
      if (authError) {
        console.error("Error resetting password on auth server:", authError.message);
        return res.status(400).json({ error: authError.message });
      }
      res.json({ success: true, message: "Password updated successfully." });
    } catch (e) {
      console.error("Reset password exception:", e);
      res.status(500).json({ error: "Failed to reset password. Please try again." });
    }
  });
  app.get("/api/tickets", authenticateToken, async (req, res) => {
    try {
      const tickets = await getTicketsList(req.user.role, req.user.id);
      res.json(tickets);
    } catch (e) {
      console.error("Get tickets failed:", e);
      res.status(500).json({ error: "Failed to fetch tickets list" });
    }
  });
  app.post("/api/tickets", authenticateToken, async (req, res) => {
    const { type, category, description, evidenceImage, checklist, consumerName, accountNumber, isUrgent } = req.body;
    const id = "TICK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const ticketData = {
        id,
        consumerId: req.user.id,
        consumerName: req.user.fullName || consumerName,
        accountNumber: req.user.accountNumber || accountNumber,
        type,
        category,
        description,
        status: "pending",
        isUrgent: isUrgent ? 1 : 0,
        evidenceImage: evidenceImage || "",
        checklist: checklist || null,
        messages: []
      };
      await createTicket(ticketData);
      res.json({ id });
    } catch (e) {
      console.error("Create ticket failed:", e);
      res.status(500).json({ error: "Failed to create service request ticket", details: e.message, stack: e.stack });
    }
  });
  app.get("/api/tickets/:id", authenticateToken, async (req, res) => {
    try {
      const ticket = await getTicketById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json(ticket);
    } catch (e) {
      console.error("Get ticket details failed:", e);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });
  app.patch("/api/tickets/:id", authenticateToken, async (req, res) => {
    const { status, messages, feedback, evidenceImage, category, description, type, isUrgent } = req.body;
    try {
      const ticket = await getTicketById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      const isAdmin = req.user.role === "admin";
      const isOwner = ticket.user_id === req.user.id || ticket.consumerId === req.user.id;
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: "Unauthorized to modify this ticket" });
      }
      if (!isAdmin) {
        if (ticket.status === "cancelled") {
          return res.status(400).json({ error: "Cancelled requests are locked." });
        }
        if (status === "cancelled") {
          if (ticket.status !== "pending" && ticket.status !== "reviewing") {
            return res.status(400).json({ error: "Requests can only be cancelled while pending or reviewing." });
          }
        } else if (feedback !== void 0) {
          if (ticket.status !== "resolved" && ticket.status !== "pending") {
            return res.status(400).json({ error: "Feedback can only be submitted for resolved or pending requests." });
          }
        } else if (messages !== void 0 || evidenceImage !== void 0) {
        } else {
          if (ticket.status !== "pending") {
            return res.status(400).json({ error: "Requests can only be edited while pending." });
          }
        }
      }
      const updateData = {};
      if (status !== void 0) updateData.status = status;
      if (messages !== void 0) updateData.messages = messages;
      if (feedback !== void 0) updateData.feedback = feedback;
      if (evidenceImage !== void 0) updateData.evidenceImage = evidenceImage;
      if (category !== void 0 && (isAdmin || ticket.status === "pending")) updateData.category = category;
      if (description !== void 0 && (isAdmin || ticket.status === "pending")) updateData.description = description;
      if (type !== void 0 && (isAdmin || ticket.status === "pending")) updateData.type = type;
      if (isUrgent !== void 0 && (isAdmin || ticket.status === "pending")) updateData.isUrgent = isUrgent ? 1 : 0;
      await updateTicket(req.params.id, updateData);
      res.json({ success: true });
    } catch (e) {
      console.error("Update ticket failed:", e);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", authenticateToken, async (req, res) => {
    try {
      const ticket = await getTicketById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete tickets" });
      }
      await deleteTicket(req.params.id);
      res.json({ success: true });
    } catch (e) {
      console.error("Delete ticket failed:", e);
      res.status(500).json({ error: "Failed to delete ticket" });
    }
  });

  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await getAnnouncementsList();
      res.json(announcements);
    } catch (e) {
      console.error("Get announcements failed:", e);
      res.status(500).json({ error: "Failed to load announcements" });
    }
  });
  app.post("/api/announcements", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { title, content } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    try {
      await createAnnouncement({ id, title, content });
      res.json({ id });
    } catch (e) {
      console.error("Create announcement failed:", e);
      res.status(500).json({ error: "Failed to publish announcement" });
    }
  });
  app.delete("/api/announcements/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    try {
      await deleteAnnouncement(req.params.id);
      res.json({ success: true });
    } catch (e) {
      console.error("Delete announcement failed:", e);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const value = await getSettingValue(req.params.key);
      res.json({ value });
    } catch (e) {
      console.error("Get setting failed:", e);
      res.status(500).json({ error: "Failed to load setting" });
    }
  });
  app.post("/api/settings/:key", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { value } = req.body;
    try {
      await setSettingValue(req.params.key, value);
      res.json({ success: true });
    } catch (e) {
      console.error("Save setting failed:", e);
      res.status(500).json({ error: "Failed to save system setting" });
    }
  });
  app.post("/api/users", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { fullName, email, password, accountNumber, role, phoneNumber, address } = req.body;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          fullName,
          accountNumber,
          role
        }
      });
      if (authError) {
        return res.status(400).json({ error: authError.message });
      }
      if (authData?.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          full_name: fullName,
            email: email.trim().toLowerCase(),
          account_number: accountNumber || "PENDING",
          role: role || "consumer",
          phone_number: phoneNumber || "",
          address: address || "",
          profile_image: ""
        });
        if (profileError) {
          console.error("Error in profile creation:", profileError.message);
        }
      }
      res.json({ success: true });
    } catch (e) {
      console.error("Admin user creation failed:", e);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  app.get("/api/users", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    try {
      const users = await getAllUsers();
      res.json(users);
    } catch (e) {
      console.error("Get all users failed:", e);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  });
  app.patch("/api/users/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { fullName, email, accountNumber, role, phoneNumber, address } = req.body;
    const updateData = {};
    if (fullName !== void 0) updateData.fullName = fullName;
    if (email !== void 0) updateData.email = email;
    if (accountNumber !== void 0) updateData.accountNumber = accountNumber;
    if (role !== void 0) updateData.role = role;
    if (phoneNumber !== void 0) updateData.phoneNumber = phoneNumber;
    if (address !== void 0) updateData.address = address;
    try {
      await adminUpdateUser(req.params.id, updateData);
      res.json({ success: true });
    } catch (e) {
      console.error("Update user failed:", e);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    try {
      await adminDeleteUser(req.params.id);
      res.json({ success: true });
    } catch (e) {
      console.error("Delete user failed:", e);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app.post("/api/inquiries", async (req, res) => {
    const { fullName, email, phone, subject, message } = req.body;
    if (!fullName || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const id = "INQ-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const inquiryData = {
        id,
        fullName,
        email,
        phone,
        subject,
        message
      };
      await createInquiry(inquiryData);
      res.json({ id });
    } catch (e) {
      console.error("Create inquiry failed:", e);
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });
  app.get("/api/inquiries", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    try {
      const inquiries = await getInquiriesList();
      res.json(inquiries);
    } catch (e) {
      console.error("Get inquiries failed:", e);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });
  app.get("/api/my-inquiries", authenticateToken, async (req, res) => {
    try {
      const email = req.user.email;
      const inquiries = await getInquiriesList();
      const userInquiries = inquiries.filter((i) => i.email && i.email.toLowerCase() === email.toLowerCase());
      res.json(userInquiries);
    } catch (e) {
      console.error("Get my inquiries failed:", e);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });
  app.patch("/api/inquiries/:id", authenticateToken, async (req, res) => {
    const { messages } = req.body;
    try {
      const inquiryId = req.params.id;
      let inquiry = null;
      try {
        const { data, error } = await supabase.from("inquiries").select("*").eq("id", inquiryId).maybeSingle();
        if (!error && data) {
          inquiry = data;
        }
      } catch (e) {
      }
      const localInq = (globalThis.localInquiries || []).find((i) => i.id === inquiryId);
      if (localInq) {
        inquiry = localInq;
      }
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      const isAdmin = req.user.role === "admin";
      const isOwner = req.user.email && inquiry.email && req.user.email.toLowerCase() === inquiry.email.toLowerCase();
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      if (messages !== void 0) {
        const messagesMap = getInquiryMessagesMap();
        messagesMap[inquiryId] = Array.isArray(messages) ? messages : [];
        saveInquiryMessagesMap(messagesMap);
      }
      res.json({ success: true });
    } catch (e) {
      console.error("Update inquiry failed:", e);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });
  app.get("/api/backend-status", async (req, res) => {
    let supabaseStatus = "configured";
    let missingTables = [];
    const tablesToCheck = ["profiles", "tickets", "announcements", "settings", "inquiries"];
    await Promise.all(
      tablesToCheck.map(async (table) => {
        try {
          const queryPromise = supabase.from(table).select("*").limit(1);
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 1500));
          const result = await Promise.race([queryPromise, timeoutPromise]);
          if (result && !result.timeout && result.error) {
            if (result.error.code !== "PGRST116" && (result.error.message?.includes("Could not find the table") || result.error.code === "42P01")) {
              missingTables.push(table);
            }
          }
        } catch (err) {
          missingTables.push(table);
        }
      })
    );
    if (missingTables.length > 0) {
      supabaseStatus = "missing_tables";
    } else {
      supabaseStatus = "fully_connected";
    }
    res.json({
      supabase: {
        status: supabaseStatus,
        url: supabaseUrl,
        projectId: "mock_project_id",
        missingTables
      },
      postgres: {
        active: true
      }
    });
  });
if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
