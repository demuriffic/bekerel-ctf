export const CTF_CONFIG = {
  name: process.env.NEXT_PUBLIC_CTF_NAME || process.env.CTF_NAME || 'CYBER_DEFENSE_CTF',
  description:
    process.env.NEXT_PUBLIC_CTF_DESCRIPTION ||
    process.env.CTF_DESCRIPTION ||
    'Capture the Flag Competition — Hack the system, uncover flags, climb the leaderboard.',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@ctf.local',
};
