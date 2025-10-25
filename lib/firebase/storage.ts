"use client"

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "./config"

export const uploadImage = async (file: File, path: string): Promise<string> => {
  console.log("[v0] Starting image upload:", path)

  try {
    const storageRef = ref(storage, path)

    // Create upload promise with timeout
    const uploadPromise = uploadBytes(storageRef, file).then(async (snapshot) => {
      console.log("[v0] Upload successful, getting download URL")
      const downloadURL = await getDownloadURL(storageRef)
      console.log("[v0] Download URL obtained:", downloadURL)
      return downloadURL
    })

    // Add 30 second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Upload timeout - La subida de imagen tardó demasiado")), 30000)
    })

    const downloadURL = await Promise.race([uploadPromise, timeoutPromise])
    return downloadURL
  } catch (error: any) {
    console.error("[v0] Image upload error:", error)

    // Provide specific error messages
    if (error.code === "storage/unauthorized") {
      throw new Error("No tienes permisos para subir imágenes. Verifica las reglas de Firebase Storage.")
    } else if (error.message?.includes("timeout")) {
      throw new Error("La subida de imagen tardó demasiado. Intenta con una imagen más pequeña.")
    } else {
      throw new Error(`Error al subir imagen: ${error.message || "Error desconocido"}`)
    }
  }
}

export const deleteImage = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
