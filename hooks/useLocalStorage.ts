import { useState, useEffect } from 'react';
import { Habit, UserStats } from '../types';

interface Category {
    name: string;
    icon: string;
}

export const useLocalStorage = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [user, setUser] = useState<UserStats>({
        xp: 0,
        level: 1,
        totalXp: 0,
        username: ''
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [view, setView] = useState<'login' | 'dashboard' | 'settings'>('login');

    // Load from localStorage on mount
    useEffect(() => {
        const savedHabits = localStorage.getItem('habit_quest_habits');
        const savedUser = localStorage.getItem('habit_quest_user');
        const savedView = localStorage.getItem('habit_quest_view');
        const savedCats = localStorage.getItem('habit_quest_categories');

        if (savedHabits) {
            setHabits(JSON.parse(savedHabits).map((h: any) => ({
                ...h,
                history: h.history || [],
                description: h.description || '',
                isPaused: !!h.isPaused
            })));
        }
        if (savedCats) setCategories(JSON.parse(savedCats));
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedView) setView(savedView as 'login' | 'dashboard' | 'settings');
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('habit_quest_habits', JSON.stringify(habits));
        localStorage.setItem('habit_quest_user', JSON.stringify(user));
        localStorage.setItem('habit_quest_view', view);
        localStorage.setItem('habit_quest_categories', JSON.stringify(categories));
    }, [habits, user, view, categories]);

    return {
        habits,
        setHabits,
        user,
        setUser,
        categories,
        setCategories,
        view,
        setView
    };
};
