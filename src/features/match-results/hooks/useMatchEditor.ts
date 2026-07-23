import { Dispatch, SetStateAction, useState } from 'react';
import { matchApi } from '../../../api/service';
import { PlayerDTO } from '../../../api/types';
import { Match, MatchEvent } from '../../../types';
import { buildMatchUpdatePayload, validateMatchEdit } from '../utils/matchEditor';
import { applyEventTypeDefaults } from '../../../utils/matchEvents';

interface MatchEditorOptions {
  setSelectedMatch: Dispatch<SetStateAction<Match | null>>;
  homeTeamPlayers: PlayerDTO[];
  awayTeamPlayers: PlayerDTO[];
  loadTeamPlayers: (homeTeamId: string, awayTeamId: string, seasonId?: string) => Promise<void>;
  loadMatches: () => Promise<void>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export const useMatchEditor = ({
  setSelectedMatch,
  homeTeamPlayers,
  awayTeamPlayers,
  loadTeamPlayers,
  loadMatches,
  setIsLoading,
  setError,
}: MatchEditorOptions) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [editData, setEditData] = useState<Match | null>(null);

  const viewMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const editMatch = async (match: Match) => {
    setSelectedMatch(match);
    setEditData({ ...match });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
    if (match.homeTeamId && match.awayTeamId) {
      await loadTeamPlayers(match.homeTeamId, match.awayTeamId, match.seasonId);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const changeField = (field: keyof Match, value: string | number) => {
    setEditData((current) => (current ? { ...current, [field]: value } : current));
  };

  const changeLineup = (
    playerId: string,
    teamType: 'home' | 'away',
    type: 'starting' | 'substitute' | 'none',
  ) => {
    setEditData((current) => {
      if (!current) return current;
      const lineups = (current.lineups || []).filter((lineup) => lineup.playerId !== playerId);
      if (type !== 'none') lineups.push({ playerId, teamType, lineupType: type });
      return { ...current, lineups };
    });
  };

  const selectEventPlayer = (
    index: number,
    playerId: string,
    prefix: '' | 'sub' | 'assist' = '',
  ) => {
    setEditData((current) => {
      if (!current) return current;
      const event = current.events[index];
      const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
      const player = players.find((candidate) => candidate.id === playerId);
      const events = [...(current.events || [])];
      const fields =
        prefix === 'sub'
          ? { subPlayerId: player?.id || '', subPlayerName: player?.name || '', subJerseyNumber: player?.jerseyNumber || '' }
          : prefix === 'assist'
            ? { assistPlayerId: player?.id || null, assistPlayerName: player?.name || null, assistJerseyNumber: player?.jerseyNumber || null }
            : { playerId: player?.id || '', playerName: player?.name || '', jerseyNumber: player?.jerseyNumber || '' };
      events[index] = { ...events[index], ...fields };
      return { ...current, events };
    });
  };

  const changeEvent = (index: number, field: keyof MatchEvent, value: any) => {
    setEditData((current) => {
      if (!current) return current;
      const events = [...(current.events || [])];
      let nextEvent = { ...events[index], [field]: value } as MatchEvent;
      if (field === 'eventType') {
        nextEvent = applyEventTypeDefaults(
          events[index],
          value as MatchEvent['eventType'],
          events,
        );
        if (value !== 'goal') {
          nextEvent.assistPlayerId = null;
          nextEvent.assistPlayerName = null;
          nextEvent.assistJerseyNumber = null;
        }
        if (value !== 'substitution') {
          nextEvent.subPlayerId = undefined;
          nextEvent.subPlayerName = undefined;
          nextEvent.subJerseyNumber = undefined;
        }
      }
      events[index] = nextEvent;
      return { ...current, events };
    });
  };

  const addEvent = (teamType: 'home' | 'away') => {
    const event: MatchEvent = {
      eventTime: '',
      eventType: 'goal',
      playerId: '',
      playerName: '',
      jerseyNumber: '',
      description: '',
      teamType,
    };
    setEditData((current) =>
      current ? { ...current, events: [...(current.events || []), event] } : current,
    );
  };

  const removeEvent = (index: number) => {
    setEditData((current) =>
      current
        ? { ...current, events: current.events.filter((_, eventIndex) => eventIndex !== index) }
        : current,
    );
  };

  const saveEdit = async () => {
    if (!editData) return;
    setError(null);
    const validationError = validateMatchEdit(editData);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    try {
      await matchApi.update(editData.id, buildMatchUpdatePayload(editData));
      setIsSaved(true);
      void loadMatches();
      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        setEditData(null);
      }, 2000);
    } catch (saveError) {
      console.error('更新比赛信息失败:', saveError);
      setError(saveError instanceof Error ? saveError.message : '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEditing,
    isSaved,
    editData,
    setEditData,
    viewMatch,
    editMatch,
    cancelEdit,
    changeField,
    changeLineup,
    changeEvent,
    selectEventPlayer,
    addEvent,
    removeEvent,
    saveEdit,
  };
};
