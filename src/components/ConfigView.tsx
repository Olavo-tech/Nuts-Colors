/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameSettings, PlayerProfile } from '../types';
import { Volume2, VolumeX, Moon, Sun, RotateCcw, Globe, ArrowLeft } from 'lucide-react';
import audio from '../utils/audioEngine';
import ThemeParticles, { getThemeDetails } from './ThemeParticles';

interface ConfigViewProps {
  settings: GameSettings;
  profile: PlayerProfile;
  onChangeSettings: (settings: GameSettings) => void;
  onClose: () => void;
  onResetProgress: () => void;
}

export default function ConfigView({ settings, profile, onChangeSettings, onClose, onResetProgress }: ConfigViewProps) {
  const [resetConfirm, setResetConfirm] = useState(false);
  const isPt = settings.language === 'pt-BR';

  const selectedTheme = profile.selectedTheme || 'classic';

  const isClassicTheme = selectedTheme === 'classic';
  const themeDetails = getThemeDetails(selectedTheme, isPt);

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newSettings = { ...settings, sfxVolume: val };
    onChangeSettings(newSettings);
    audio.setSfxVolume(val);
    audio.playClick();
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newSettings = { ...settings, musicVolume: val };
    onChangeSettings(newSettings);
    audio.setMusicVolume(val);
  };

  const changeLanguage = (lang: 'pt-BR' | 'en-US') => {
    audio.playClick();
    onChangeSettings({ ...settings, language: lang });
  };

  const triggerReset = () => {
    audio.playError();
    if (resetConfirm) {
      onResetProgress();
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000); // Reset confirm after 4 seconds
    }
  };

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto relative text-white">
      {/* Dynamic Theme Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${themeDetails.gradient} transition-all duration-1000 z-0`} />
      <ThemeParticles theme={selectedTheme as any} />

      {/* Header */}
      <header className={`h-20 w-full flex items-center justify-between px-6 border-b backdrop-blur-md z-10 shrink-0 ${
        isClassicTheme ? 'border-zinc-800 bg-zinc-950/40' : 'border-white/10 bg-black/40'
      }`}>
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            isClassicTheme
              ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100'
              : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
          }`}
          title="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold tracking-tight uppercase text-white font-display">
          {settings.language === 'pt-BR' ? 'Configurações' : 'Settings'}
        </h2>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Settings Options */}
      <div className="my-6 flex-1 space-y-4 overflow-y-auto px-6 pr-4 z-10">
        {/* SFX Volume */}
        <div className={`p-4 rounded-[24px] border ${isClassicTheme ? 'bg-zinc-900/80 border-zinc-850' : 'bg-black/30 border-white/5'}`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              {settings.sfxVolume > 0 ? (
                <Volume2 size={16} className={isClassicTheme ? 'text-zinc-100' : `${themeDetails.accentText}`} />
              ) : (
                <VolumeX size={16} className="text-zinc-500" />
              )}
              {settings.language === 'pt-BR' ? 'Efeitos Sonoros (SFX)' : 'Sound Effects (SFX)'}
            </span>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
              isClassicTheme
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 font-bold'
                : 'bg-black/40 border-white/10 text-white font-bold'
            }`}>
              {Math.round(settings.sfxVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.sfxVolume}
            onChange={handleSfxChange}
            className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-950 ${
              isClassicTheme ? 'accent-zinc-100' : 'accent-white'
            }`}
          />
        </div>

        {/* Music Volume */}
        <div className={`p-4 rounded-[24px] border ${isClassicTheme ? 'bg-zinc-900/80 border-zinc-850' : 'bg-black/30 border-white/5'}`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              {settings.musicVolume > 0 ? (
                <Volume2 size={16} className={isClassicTheme ? 'text-zinc-300' : `${themeDetails.accentText}`} />
              ) : (
                <VolumeX size={16} className="text-zinc-500" />
              )}
              {settings.language === 'pt-BR' ? 'Música Ambiente' : 'Background Music'}
            </span>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
              isClassicTheme
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 font-bold'
                : 'bg-black/40 border-white/10 text-white font-bold'
            }`}>
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={handleMusicChange}
            className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-950 ${
              isClassicTheme ? 'accent-zinc-100' : 'accent-white'
            }`}
          />
        </div>

        {/* Visual Theme Info Card */}
        <div className={`p-4 flex items-center justify-between rounded-[24px] border ${
          isClassicTheme ? 'bg-zinc-900/80 border-zinc-850' : 'bg-black/30 border-white/5'
        }`}>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Moon size={16} className={isClassicTheme ? 'text-zinc-400' : `${themeDetails.accentText}`} />
              {settings.language === 'pt-BR' ? 'Tema Visual' : 'Visual Theme'}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold font-mono">
              {themeDetails.name}
            </span>
          </div>
          <div className={`px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase ${
            isClassicTheme
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
              : `${themeDetails.badgeColor}`
          }`}>
            {settings.language === 'pt-BR' ? 'ATIVO' : 'ACTIVE'}
          </div>
        </div>

        {/* Language Selection */}
        <div className={`p-4 rounded-[24px] border ${isClassicTheme ? 'bg-zinc-900/80 border-zinc-850' : 'bg-black/30 border-white/5'}`}>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <Globe size={16} className={isClassicTheme ? 'text-zinc-400' : `${themeDetails.accentText}`} />
            <span>{settings.language === 'pt-BR' ? 'Idioma' : 'Language'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => changeLanguage('pt-BR')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                settings.language === 'pt-BR'
                  ? isClassicTheme
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-white text-black shadow-md'
                  : isClassicTheme
                    ? 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:bg-zinc-900'
                    : 'bg-black/40 text-zinc-400 border border-white/5 hover:bg-white/5'
              }`}
            >
              Português
            </button>
            <button
              onClick={() => changeLanguage('en-US')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                settings.language === 'en-US'
                  ? isClassicTheme
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-white text-black shadow-md'
                  : isClassicTheme
                    ? 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:bg-zinc-900'
                    : 'bg-black/40 text-zinc-400 border border-white/5 hover:bg-white/5'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Danger Zone: Reset Progress */}
        <div className={`rounded-[24px] p-4 border ${
          isClassicTheme
            ? 'border-zinc-800 bg-zinc-950/10'
            : 'border-red-950/30 bg-red-950/10'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                {settings.language === 'pt-BR' ? 'Resetar Todo o Progresso' : 'Reset All Progress'}
              </span>
              <span className="text-[10px] text-zinc-400 max-w-xs mt-1">
                {settings.language === 'pt-BR'
                  ? 'Esta ação é irreversível. Todas as suas estrelas, XP e níveis desbloqueados serão apagados.'
                  : 'This action is irreversible. All your stars, XP, and level unlocks will be deleted.'}
              </span>
            </div>
            <button
              onClick={triggerReset}
              className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 ${
                resetConfirm
                  ? 'bg-red-600 text-white animate-pulse'
                  : isClassicTheme
                    ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
                    : 'bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-800/40'
              }`}
            >
              <RotateCcw size={12} />
              {resetConfirm
                ? (settings.language === 'pt-BR' ? 'Confirmar!' : 'Confirm!')
                : (settings.language === 'pt-BR' ? 'Resetar' : 'Reset')}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Close Button */}
      <div className={`p-6 border-t ${isClassicTheme ? 'border-zinc-850' : 'border-white/10'}`}>
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="w-full py-3.5 pro-button-primary text-xs"
        >
          {settings.language === 'pt-BR' ? 'Salvar e Voltar' : 'Save and Close'}
        </button>
      </div>
    </div>
  );
}
