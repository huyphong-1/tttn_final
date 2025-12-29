export const ADMIN_EMAILS = [
  'admin@techphone.com',
];

export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const getAdminEmails = () => [...ADMIN_EMAILS];

export const addAdminEmail = (email) => {
  if (!email || ADMIN_EMAILS.includes(email.toLowerCase())) return false;
  ADMIN_EMAILS.push(email.toLowerCase());
  return true;
};

export const removeAdminEmail = (email) => {
  if (!email) return false;
  const index = ADMIN_EMAILS.indexOf(email.toLowerCase());
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    return true;
  }
  return false;
};
