// src/app/actions/users.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, mutate } from "@/lib/db";

// Typendefinition für einen Benutzer
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

// Server Action zum Abrufen aller Benutzer
export async function getUsers(): Promise<User[]> {
  try {
    return await query<User>("SELECT * FROM users ORDER BY created_at DESC");
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error);
    throw new Error("Benutzer konnten nicht abgerufen werden");
  }
}

// Server Action zum Abrufen eines Benutzers nach ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error(`Fehler beim Abrufen des Benutzers mit ID ${id}:`, error);
    throw new Error("Benutzer konnte nicht abgerufen werden");
  }
}

// Server Action zum Erstellen eines neuen Benutzers
export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) {
    throw new Error("Name und E-Mail sind erforderlich");
  }

  try {
    await mutate(
      "INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW())",
      [name, email]
    );

    // Seite nach der Mutation revalidieren
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Erstellen des Benutzers:", error);
    throw new Error("Benutzer konnte nicht erstellt werden");
  }
}

// Server Action zum Aktualisieren eines Benutzers
export async function updateUser(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) {
    throw new Error("Name und E-Mail sind erforderlich");
  }

  try {
    await mutate("UPDATE users SET name = $1, email = $2 WHERE id = $3", [
      name,
      email,
      id,
    ]);

    // Seite nach der Mutation revalidieren
    revalidatePath(`/users/${id}`);
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(
      `Fehler beim Aktualisieren des Benutzers mit ID ${id}:`,
      error
    );
    throw new Error("Benutzer konnte nicht aktualisiert werden");
  }
}

// Server Action zum Löschen eines Benutzers
export async function deleteUser(id: number) {
  try {
    await mutate("DELETE FROM users WHERE id = $1", [id]);

    // Seite nach der Mutation revalidieren
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(`Fehler beim Löschen des Benutzers mit ID ${id}:`, error);
    throw new Error("Benutzer konnte nicht gelöscht werden");
  }
}
