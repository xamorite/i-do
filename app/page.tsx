'use client';

import React, { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Calendar, Clock, Briefcase, Music, Brush, Utensils, Users, Shield } from 'lucide-react';

// --- Global Variables (Provided by Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The large, structured schedule data manually extracted from schedule.md
const MONTHLY_SCHEDULE_DATA = [
  { date: 'Dec 1', day: 'Mon', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music (New Piece)', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Drawing Sketching', type: 'hobby' },
  ]},
  { date: 'Dec 2', day: 'Tue', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Bug Fixes', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Drawing: New Project Start', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music (Editing)', type: 'music' },
  ]},
  { date: 'Dec 3', day: 'Wed', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice (Warm-ups)', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Reading (Non-Portfolio)', type: 'personal' },
  ]},
  { date: 'Dec 4', day: 'Thu', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music (Finalizing)', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 7:00 PM', desc: 'Trumpet Recording Prep', type: 'music-special' },
    { time: '7:00 PM - 8:00 PM', desc: 'Flex/Dinner Prep', type: 'personal' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Reading (Non-Portfolio)', type: 'personal' },
  ]},
  { date: 'Dec 5', day: 'Fri', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Follow-ups', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Drawing: Project Refinement', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '9:00 PM - 12:00 AM', desc: 'Vigil (Special Event)', type: 'spiritual-special' },
  ]},
  { date: 'Dec 6', day: 'Sat', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 9:00 AM', desc: 'Trumpet Scoring (Pre-Study)', type: 'music' },
    { time: '9:00 AM - 10:00 AM', desc: 'Bible Study with Pastor Tola', type: 'spiritual' },
    { time: '10:00 AM - 12:00 PM', desc: 'Trumpet Scoring (Post-Study)', type: 'music' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 3:30 PM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '3:30 PM - 8:00 PM', desc: 'Movie Time', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Next Day Prep/Reading', type: 'personal' },
  ]},
  { date: 'Dec 7', day: 'Sun', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing (Deep Work)', type: 'hobby' },
    { time: '6:00 AM - 1:00 PM', desc: 'CHURCH SERVICE', type: 'spiritual' },
    { time: '1:00 PM - 2:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '2:00 PM - 3:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '3:00 PM - 8:00 PM', desc: 'Movie Time', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music (Finalizing)', type: 'music' },
  ]},
  { date: 'Dec 8', day: 'Mon', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music (New Idea)', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Call Oyekanmi Anjola', type: 'call' },
    { time: '4:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice (New Song)', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Drawing Detail Work', type: 'hobby' },
  ]},
  { date: 'Dec 9', day: 'Tue', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Call Folakunmi Akinola', type: 'call' },
    { time: '4:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Work: Integrations Focus', type: 'work' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Reading (Non-Portfolio)', type: 'personal' },
  ]},
  { date: 'Dec 10', day: 'Wed', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 7:00 PM', desc: 'Trumpet Recording Session', type: 'music-special' },
    { time: '7:00 PM - 8:00 PM', desc: 'Dinner/Wind Down', type: 'personal' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music (Editing)', type: 'music' },
  ]},
  { date: 'Dec 11', day: 'Thu', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 1:00 PM', desc: 'Music App: Auth (Goal)', type: 'work-goal' },
    { time: '1:00 PM - 2:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '2:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '4:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Drawing Sketching', type: 'hobby' },
  ]},
  { date: 'Dec 12', day: 'Fri', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 12:00 PM', desc: 'Source for Songs (Music Goal)', type: 'music' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music', type: 'music' },
  ]},
  { date: 'Dec 13', day: 'Sat', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 9:00 AM', desc: 'Music App: Prep', type: 'work-goal' },
    { time: '9:00 AM - 10:00 AM', desc: 'Bible Study with Pastor Tola', type: 'spiritual' },
    { time: '10:00 AM - 11:00 AM', desc: 'Music App: Prep (Cont.)', type: 'work-goal' },
    { time: '11:00 AM - 2:00 PM', desc: 'Music App: Playback (Goal)', type: 'work-goal' },
    { time: '2:00 PM - 3:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '3:00 PM - 4:00 PM', desc: 'Drawing + Read Portfolio', type: 'hobby' },
    { time: '4:00 PM - 8:00 PM', desc: 'Movie Time', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Next Day Prep/Reading', type: 'personal' },
  ]},
  { date: 'Dec 14', day: 'Sun', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music', type: 'music' },
    { time: '6:00 AM - 1:00 PM', desc: 'CHURCH SERVICE', type: 'spiritual' },
    { time: '1:00 PM - 2:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '2:00 PM - 5:00 PM', desc: 'Music App: Playlist (Goal)', type: 'work-goal' },
    { time: '5:00 PM - 6:00 PM', desc: 'Cook/Dinner', type: 'personal' },
    { time: '6:00 PM - 8:00 PM', desc: 'Drawing', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
  ]},
  { date: 'Dec 15', day: 'Mon', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Call Racheal', type: 'call' },
    { time: '4:00 PM - 5:00 PM', desc: 'Work: Integrations (Post-Call)', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Drawing Detail Work', type: 'hobby' },
  ]},
  { date: 'Dec 16', day: 'Tue', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Call Jesse King', type: 'call' },
    { time: '4:00 PM - 5:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music (New Idea)', type: 'music' },
  ]},
  { date: 'Dec 17', day: 'Wed', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music (Editing)', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 6:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '6:00 PM - 9:00 PM', desc: 'Praise Night (Special Event)', type: 'spiritual-special' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe (during Praise Night)', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Reading (Non-Portfolio)', type: 'personal' },
  ]},
  { date: 'Dec 18', day: 'Thu', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 12:00 PM', desc: 'Music App: UI Design (Goal)', type: 'work-goal' },
    { time: '12:00 PM - 1:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '1:00 PM - 2:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '2:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '4:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Trumpet Scoring', type: 'music' },
  ]},
  { date: 'Dec 19', day: 'Fri', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 12:00 PM', desc: 'Music App: Responsiveness (Goal)', type: 'work-goal' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Drawing Project Time', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Movie Time', type: 'hobby' },
  ]},
  { date: 'Dec 20', day: 'Sat', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 9:00 AM', desc: 'Work: Dev/Integrations Prep', type: 'work' },
    { time: '9:00 AM - 10:00 AM', desc: 'Bible Study with Pastor Tola', type: 'spiritual' },
    { time: '10:00 AM - 11:00 AM', desc: 'Drawing Prep', type: 'hobby' },
    { time: '11:00 AM - 12:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 4:00 PM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '4:00 PM - 7:00 PM', desc: 'Work: Light Integrations', type: 'work' },
    { time: '7:00 PM - 10:00 PM', desc: 'Take Babe Out (Dinner)', type: 'personal-special' },
    { time: '10:00 PM - 12:00 AM', desc: 'Wind Down / Reading', type: 'personal' },
  ]},
  { date: 'Dec 21', day: 'Sun', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing (Deep Work)', type: 'hobby' },
    { time: '6:00 AM - 1:00 PM', desc: 'CHURCH SERVICE', type: 'spiritual' },
    { time: '1:00 PM - 2:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '2:00 PM - 6:00 PM', desc: 'Movie Time', type: 'hobby' },
    { time: '6:00 PM - 8:00 PM', desc: 'Trumpet Scoring', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
  ]},
  { date: 'Dec 22', day: 'Mon', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 2:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '2:00 PM - 6:00 PM', desc: 'Build Make.com Apps (Goal)', type: 'work-goal' },
    { time: '6:00 PM - 8:00 PM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Reading (Non-Portfolio)', type: 'personal' },
  ]},
  { date: 'Dec 23', day: 'Tue', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 12:00 PM', desc: 'Music App: E2E Testing (Goal)', type: 'work-goal' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 3:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '3:00 PM - 4:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '4:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music (Finalizing)', type: 'music' },
  ]},
  { date: 'Dec 24', day: 'Wed', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 12:00 PM', desc: 'Music App: Deployment Prep (Goal)', type: 'work-goal' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Drawing Project Time', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Movie Time', type: 'hobby' },
  ]},
  { date: 'Dec 25', day: 'Thu', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations (Light)', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch (Christmas Meal)', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Movie Time', type: 'hobby' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Reading (Non-Portfolio)', type: 'personal' },
  ]},
  { date: 'Dec 26', day: 'Fri', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 7:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '7:00 PM - 8:00 PM', desc: 'Read Portfolio', type: 'work' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music', type: 'music' },
  ]},
  { date: 'Dec 27', day: 'Sat', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 9:00 AM', desc: 'YADAH (Morning Prep)', type: 'spiritual-special' },
    { time: '9:00 AM - 10:00 AM', desc: 'Bible Study with Pastor Tola', type: 'spiritual' },
    { time: '10:00 AM - 12:00 PM', desc: 'YADAH (Pre-Event)', type: 'spiritual-special' },
    { time: '12:00 PM - 10:00 PM', desc: 'YADAH (All Day Event)', type: 'spiritual-special' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe (during YADAH)', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Wind Down / Light Reading', type: 'personal' },
  ]},
  { date: 'Dec 28', day: 'Sun', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music', type: 'music' },
    { time: '6:00 AM - 1:00 PM', desc: 'CHURCH SERVICE', type: 'spiritual' },
    { time: '1:00 PM - 2:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '2:00 PM - 6:00 PM', desc: 'Movie Time', type: 'hobby' },
    { time: '6:00 PM - 8:00 PM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Deep Work: Integrations', type: 'work' },
  ]},
  { date: 'Dec 29', day: 'Mon', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Work: Integrations Deep Dive', type: 'work' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 11:00 AM', desc: 'Read Portfolio', type: 'work' },
    { time: '11:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations (Post-Read)', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Drawing Sketching', type: 'hobby' },
  ]},
  { date: 'Dec 30', day: 'Tue', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Drawing Practice', type: 'hobby' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 12:00 PM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Work: Integrations Focus', type: 'work' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'Score Music', type: 'music' },
  ]},
  { date: 'Dec 31', day: 'Wed', activities: [
    { time: '3:00 AM - 6:00 AM', desc: 'Score Music (New Year Idea)', type: 'music' },
    { time: '6:00 AM - 7:00 AM', desc: 'Freshen Up & Bible Reading', type: 'spiritual' },
    { time: '7:00 AM - 10:00 AM', desc: 'Work: Dev/Integrations', type: 'work' },
    { time: '10:00 AM - 11:00 AM', desc: 'Read Portfolio (Finish!)', type: 'work' },
    { time: '11:00 AM - 12:00 PM', desc: 'Work: Integrations Prep', type: 'work' },
    { time: '12:00 PM - 1:00 PM', desc: 'Cook/Lunch', type: 'personal' },
    { time: '1:00 PM - 5:00 PM', desc: 'Work: Integrations', type: 'work' },
    { time: '5:00 PM - 8:00 PM', desc: 'Trumpet Practice', type: 'music' },
    { time: '8:00 PM - 10:00 PM', desc: 'Chat with Babe', type: 'personal' },
    { time: '10:00 PM - 12:00 AM', desc: 'NYE Wind Down/Prep', type: 'personal' },
  ]},
];
// --- End of Schedule Data ---

// Helper function to get the appropriate icon based on activity type
const getActivityIcon = (type) => {
  switch (type.split('-')[0]) {
    case 'work': return <Briefcase size={16} className="text-blue-500" />;
    case 'music': return <Music size={16} className="text-red-500" />;
    case 'hobby': return <Brush size={16} className="text-green-500" />;
    case 'spiritual': return <Shield size={16} className="text-purple-500" />;
    case 'personal': return <Utensils size={16} className="text-yellow-500" />;
    case 'call': return <Users size={16} className="text-indigo-500" />;
    default: return <Clock size={16} className="text-gray-400" />;
  }
};

// Helper function for styling based on type
const getTypeClass = (type) => {
  switch (type.split('-')[0]) {
    case 'work': return 'bg-blue-50 ring-blue-200';
    case 'music': return 'bg-red-50 ring-red-200';
    case 'hobby': return 'bg-green-50 ring-green-200';
    case 'spiritual': return 'bg-purple-50 ring-purple-200';
    case 'personal': return 'bg-yellow-50 ring-yellow-200';
    case 'call': return 'bg-indigo-50 ring-indigo-200';
    default: return 'bg-gray-50 ring-gray-200';
  }
};


const App = () => {
  const isFirebaseConfigured = Object.keys(firebaseConfig).length > 0;
  const [firebase, setFirebase] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [schedule, setSchedule] = useState(null);
  const [message, setMessage] = useState(isFirebaseConfigured ? '' : 'Firebase configuration is missing.');
  const hasSeededSchedule = useRef(false);

  // 1. Initialize Firebase and Auth
  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }

        if (isMounted) {
          setFirebase({ db, auth });
        }

        // Set up Auth State Listener
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (isMounted) {
            setUserId(user ? user.uid : null);
            setLoading(false);
          }
        });

      } catch (error) {
        console.error('Firebase Initialization Error:', error);
        if (isMounted) {
            setLoading(false);
            setMessage('Error initializing application. Check console for details.');
        }
      }
    };

    if (isFirebaseConfigured) {
      initFirebase();
    }

    return () => {
        isMounted = false;
        unsubscribe();
    };
  }, [isFirebaseConfigured]);

  // 2. Data Persistence (Save Schedule)
  useEffect(() => {
    // Only proceed if Firebase is initialized and we have a User ID
    if (firebase && userId) {
      const scheduleRef = doc(firebase.db, 'artifacts', appId, 'users', userId, 'schedule', 'december_2025');

      // Set up onSnapshot listener for real-time data
      const unsubscribe = onSnapshot(scheduleRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().data) {
          // Data exists, load it
          setSchedule(docSnap.data().data);
          setMessage('Schedule loaded successfully!');
          hasSeededSchedule.current = true;
        } else if (!hasSeededSchedule.current) {
          // Data does not exist (and we haven't set the schedule yet), save the default.
          setDoc(scheduleRef, { data: MONTHLY_SCHEDULE_DATA, updated: new Date().toISOString() }, { merge: false })
            .then(() => {
              setSchedule(MONTHLY_SCHEDULE_DATA);
              setMessage('Full monthly schedule saved to your calendar!');
              hasSeededSchedule.current = true;
            })
            .catch((e) => {
              console.error('Error writing document:', e);
              setMessage('Error saving schedule data.');
            });
        }
      }, (error) => {
        console.error('Firestore subscription error:', error);
        setMessage('Error reading schedule data.');
      });

      return () => unsubscribe();
    }
  }, [firebase, userId]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Loading Schedule...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-inter">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Calendar className="mr-3 text-purple-600" size={28} />
          Emmanuel&apos;s December 2025 Master Plan
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-semibold">User ID:</span> {userId || 'N/A'} | Schedule Status: {message}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {schedule && schedule.map((dayData) => (
            <div
              key={dayData.date}
              className={`p-3 rounded-xl shadow-lg border-2 ${dayData.day === 'Sun' ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-100'} hover:shadow-xl transition-shadow duration-200`}
            >
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-200">
                <span className={`text-lg font-extrabold ${dayData.day === 'Sun' ? 'text-purple-700' : 'text-gray-800'}`}>{dayData.date}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dayData.day === 'Sun' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {dayData.day}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {dayData.activities.map((activity, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg ring-1 ${getTypeClass(activity.type)}`}
                  >
                    <div className="flex items-start">
                      {getActivityIcon(activity.type)}
                      <div className="ml-2">
                        <p className="font-medium leading-tight text-gray-800">{activity.desc}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!schedule && !loading && (
             <div className="mt-8 p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-md">
                <p className="font-semibold">Awaiting Schedule Data</p>
                <p className="text-sm">The application is ready, but waiting to either load or save the schedule to Firestore.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default App;