import {
  SupabaseTableName,
  saveRecord as saveSupabaseRecord,
  saveRecords as saveSupabaseRecords,
  updateRecord as updateSupabaseRecord,
  deleteRecord as deleteSupabaseRecord,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

// Supabase-exclusive persistence wrappers used across domain contexts
export const saveDocument = <T extends { id: string }>(table: SupabaseTableName | string, item: T) => {
  if (isSupabaseConfigured()) {
    saveSupabaseRecord(table as SupabaseTableName, item).catch((err) => {
      console.warn(`[Supabase] Persistence sync warning for ${table}:`, err);
    });
  }
};

export const saveDocuments = <T extends { id: string }>(table: SupabaseTableName | string, items: T[]) => {
  if (items.length > 0 && isSupabaseConfigured()) {
    saveSupabaseRecords(table as SupabaseTableName, items).catch((err) => {
      console.warn(`[Supabase] Batch persistence sync warning for ${table}:`, err);
    });
  }
};

export const deleteDocument = (table: SupabaseTableName | string, id: string) => {
  if (isSupabaseConfigured()) {
    deleteSupabaseRecord(table as SupabaseTableName, id).catch((err) => {
      console.warn(`[Supabase] Persistence delete warning for ${table}:`, err);
    });
  }
};

export const updateDocument = (table: SupabaseTableName | string, id: string, updates: Record<string, any>) => {
  if (isSupabaseConfigured()) {
    updateSupabaseRecord(table as SupabaseTableName, id, updates).catch((err) => {
      console.warn(`[Supabase] Persistence update warning for ${table}:`, err);
    });
  }
};
