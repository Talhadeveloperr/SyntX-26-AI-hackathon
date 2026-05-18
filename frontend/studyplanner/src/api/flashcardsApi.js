// frontend/src/api/flashcardsApi.js
import axios from "./axiosConfig";

// ── Decks ──────────────────────────────────────────────
export const getDecks    = ()              => axios.get("/flashcards/decks");
export const createDeck  = (data)         => axios.post("/flashcards/decks", data);
export const deleteDeck  = (id)           => axios.delete(`/flashcards/decks/${id}`);

// ── Cards ───────────────────────────────────────────────
export const getCards    = (deckId)       => axios.get(`/flashcards/decks/${deckId}/cards`);
export const addCard     = (deckId, data) => axios.post(`/flashcards/decks/${deckId}/cards`, data);
export const deleteCard  = (id)           => axios.delete(`/flashcards/cards/${id}`);
export const reviewCard  = (id, rating)   => axios.post(`/flashcards/cards/${id}/review`, { rating });

// ── Stats ────────────────────────────────────────────────
export const getStats    = ()             => axios.get("/flashcards/stats");
