import { useState, useEffect } from 'react';
import { DEFAULT_STAFF } from '../data/staffRoster';
import { loadStaff, saveStaff } from '../services/storage';

export function useStaff() {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    setStaff(loadStaff(DEFAULT_STAFF));
  }, []);

  function addStaffMember(name, role) {
    const newMember = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
    };
    const updated = [...staff, newMember];
    setStaff(updated);
    saveStaff(updated);
    return newMember;
  }

  function removeStaffMember(id) {
    const updated = staff.filter((s) => s.id !== id);
    setStaff(updated);
    saveStaff(updated);
  }

  return { staff, addStaffMember, removeStaffMember };
}
