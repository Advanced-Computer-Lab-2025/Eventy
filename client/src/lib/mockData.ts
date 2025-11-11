// Central mock data store for the frontend
// This simulates a backend but runs entirely in the browser

export interface Event {
  id: string;
  title: string;
  category: "academic" | "social" | "sports" | "cultural" | "career";
  date: string;
  time: string;
  location: string;
  attendees: number;
  image: string;
  description?: string;
  price?: number;
  capacity?: number;
  type?: "workshop" | "trip" | "bazaar" | "conference";
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role:
    | "student"
    | "staff"
    | "ta"
    | "professor"
    | "admin"
    | "event_office"
    | "vendor";
  status: "active" | "blocked" | "pending";
  verified: boolean;
}

// Initialize data from localStorage or use defaults
const initializeData = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Default events
const defaultEvents: Event[] = [
  {
    id: "1",
    title: "AI & Machine Learning Workshop",
    category: "academic",
    date: "March 15, 2024",
    time: "2:00 PM - 5:00 PM",
    location: "Engineering Building, Room 301",
    attendees: 45,
    image:
      "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&auto=format&fit=crop",
    type: "workshop",
    price: 50,
    capacity: 60,
  },
  {
    id: "2",
    title: "Spring Festival Celebration",
    category: "cultural",
    date: "March 20, 2024",
    time: "6:00 PM - 10:00 PM",
    location: "Main Quadrangle",
    attendees: 320,
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop",
    type: "bazaar",
  },
  {
    id: "3",
    title: "Basketball Championship Finals",
    category: "sports",
    date: "March 18, 2024",
    time: "7:00 PM - 9:00 PM",
    location: "Sports Center Arena",
    attendees: 500,
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Career Fair 2024",
    category: "career",
    date: "March 25, 2024",
    time: "10:00 AM - 4:00 PM",
    location: "Convention Center",
    attendees: 180,
    image:
      "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&auto=format&fit=crop",
    type: "conference",
  },
];

// Event store
export const eventStore = {
  getAll: (): Event[] => initializeData("events", defaultEvents),
  save: (events: Event[]) => saveData("events", events),
  add: (event: Event) => {
    const events = eventStore.getAll();
    events.push(event);
    eventStore.save(events);
  },
  update: (id: string, updates: Partial<Event>) => {
    const events = eventStore.getAll();
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      eventStore.save(events);
    }
  },
  delete: (id: string) => {
    const events = eventStore.getAll().filter((e) => e.id !== id);
    eventStore.save(events);
  },
};

// User store
export const userStore = {
  getAll: (): User[] => initializeData("users", []),
  save: (users: User[]) => saveData("users", users),
  add: (user: User) => {
    const users = userStore.getAll();
    users.push(user);
    userStore.save(users);
  },
  update: (id: string, updates: Partial<User>) => {
    const users = userStore.getAll();
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      userStore.save(users);
    }
  },
  delete: (id: string) => {
    const users = userStore.getAll().filter((u) => u.id !== id);
    userStore.save(users);
  },
  findByEmail: (email: string) => {
    return userStore.getAll().find((u) => u.email === email);
  },
};

// Auth store
export const authStore = {
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem("currentUser");
    return userJson ? JSON.parse(userJson) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  },
  logout: () => {
    localStorage.removeItem("currentUser");
  },
};

// Registration store
export const registrationStore = {
  getAll: (): string[] => initializeData("registrations", []),
  save: (registrations: string[]) => saveData("registrations", registrations),
  add: (eventId: string) => {
    const registrations = registrationStore.getAll();
    if (!registrations.includes(eventId)) {
      registrations.push(eventId);
      registrationStore.save(registrations);
    }
  },
  remove: (eventId: string) => {
    const registrations = registrationStore
      .getAll()
      .filter((id) => id !== eventId);
    registrationStore.save(registrations);
  },
  isRegistered: (eventId: string) => {
    return registrationStore.getAll().includes(eventId);
  },
};

// Favorites store
export const favoritesStore = {
  getAll: (): string[] => initializeData("favorites", []),
  save: (favorites: string[]) => saveData("favorites", favorites),
  add: (eventId: string) => {
    const favorites = favoritesStore.getAll();
    if (!favorites.includes(eventId)) {
      favorites.push(eventId);
      favoritesStore.save(favorites);
    }
  },
  remove: (eventId: string) => {
    const favorites = favoritesStore.getAll().filter((id) => id !== eventId);
    favoritesStore.save(favorites);
  },
  isFavorite: (eventId: string) => {
    return favoritesStore.getAll().includes(eventId);
  },
};
