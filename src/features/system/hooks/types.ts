import React from 'react';
import { SeasonDTO } from '../../../api/types';

export interface SystemFeedback {
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export type SeasonSummary = SeasonDTO;

export interface UserSummary {
  id: string;
  username: string;
  role: string;
  teamId?: string | null;
  [key: string]: unknown;
}

export interface UserEdit {
  role: string;
  teamId: string | null;
}

export interface SeasonGroupAssignment {
  teamId: string;
  groupName: string;
}
