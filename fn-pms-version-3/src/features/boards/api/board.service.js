// Author: Gururaj
// Created: 18th Mar 2026
// Description: Board API service for fetching board columns and moving issues between status columns.
// Version: 1.0.0
// Modified:

import api from "../../../api/axios";

export const getBoards = (projectId) => api.get(`/project/${projectId}/boards`);

export const getBoardById = (id) => api.get(`/board/${id}`);

export const createBoard = (data) => api.post("/board/create", data);

export const updateBoard = (id, data) => api.patch(`/board/update/${id}`, data);

export const deleteBoard = (id) => api.delete(`/board/delete/${id}`);

export const addColumn = (boardId, title) => api.post(`/board/${boardId}/column`, { title });

export const moveColumn = (boardId, columnId, newIndex) => 
  api.patch(`/board/${boardId}/column/move`, { columnId, newIndex });
