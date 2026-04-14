import { ref } from 'vue'

const checkedInBooths = ref<Set<string>>(new Set())

export function useCheckins() {
  function isCheckedIn(boothId: string): boolean {
    return checkedInBooths.value.has(boothId)
  }

  function toggleCheckin(boothId: string) {
    const s = new Set(checkedInBooths.value)
    if (s.has(boothId))
      s.delete(boothId)
    else
      s.add(boothId)
    checkedInBooths.value = s
  }

  return { isCheckedIn, toggleCheckin }
}
