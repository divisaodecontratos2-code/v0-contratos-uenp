import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBrazilianDate(dateInput?: string | null) {
  if (!dateInput) return "-"

  const [datePart] = dateInput.split("T")
  const parts = datePart.split("-")

  if (parts.length !== 3) {
    return dateInput
  }

  const [year, month, day] = parts

  if (!year || !month || !day) {
    return dateInput
  }

  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}
