// Official Indian cybercrime authority contacts for CC'ing on takedown notices.
// Sources: cybercrime.gov.in (I4C, MHA), state cyber crime cell public listings.
// Verify before sending — addresses change over time.

export type CyberContact = {
  name: string;
  email: string;
  jurisdiction: string;
};

export const INDIAN_CYBERCRIME_CONTACTS: CyberContact[] = [
  {
    name: "National Cyber Crime Reporting Portal (I4C, MHA)",
    email: "complaints@cybercrime.gov.in",
    jurisdiction: "National (file FIR at cybercrime.gov.in)",
  },
  {
    name: "Indian Cyber Crime Coordination Centre (I4C)",
    email: "helpdesk-i4c@mha.gov.in",
    jurisdiction: "National helpdesk",
  },
  {
    name: "CERT-In (Computer Emergency Response Team)",
    email: "incident@cert-in.org.in",
    jurisdiction: "National incident response",
  },
  {
    name: "Delhi Police Cyber Crime Cell",
    email: "cybercell.delhi@nic.in",
    jurisdiction: "Delhi NCR",
  },
  {
    name: "Mumbai Police Cyber Crime",
    email: "cybercell.mumbai@mahapolice.gov.in",
    jurisdiction: "Maharashtra / Mumbai",
  },
  {
    name: "Bengaluru City Cyber Crime",
    email: "cybercrimeps@ksp.gov.in",
    jurisdiction: "Karnataka / Bengaluru",
  },
  {
    name: "Hyderabad Cyber Crime",
    email: "cybercrime-hyd@cyb.tspolice.gov.in",
    jurisdiction: "Telangana / Hyderabad",
  },
  {
    name: "Chennai Cyber Crime Cell",
    email: "cybercrimechn@tn.gov.in",
    jurisdiction: "Tamil Nadu / Chennai",
  },
  {
    name: "Kolkata Police Cyber Crime",
    email: "occyber@kolkatapolice.gov.in",
    jurisdiction: "West Bengal / Kolkata",
  },
  {
    name: "Women Helpline (Cyber)",
    email: "complaint-mwcd@gov.in",
    jurisdiction: "National — crimes against women",
  },
];
