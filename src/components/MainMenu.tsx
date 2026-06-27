/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerProfile, GameSettings } from '../types';
import { Play, RotateCcw, Zap, Trophy, BarChart3, Settings, Info, User, HelpCircle, Trash2, UserPlus, Check, X, ShoppingBag, Sparkles, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import audio from '../utils/audioEngine';
import { storageService } from '../utils/storageService';
import ThemeParticles, { getThemeDetails } from './ThemeParticles';

interface MainMenuProps {
  profile: PlayerProfile;
  settings: GameSettings;
  onUpdateProfileName: (name: string) => void;
  onNavigate: (view: 'game' | 'levels' | 'ranking' | 'stats' | 'config' | 'multiplayer') => void;
  onResetProgress: () => void;
  onSwitchProfile?: (profile: PlayerProfile) => void;
}

export default function MainMenu({ profile, settings, onUpdateProfileName, onNavigate, onResetProgress, onSwitchProfile }: MainMenuProps) {
  const isPt = settings.language === 'pt-BR';
  const [nameInput, setNameInput] = useState(profile.name || '');
  const [isEditingName, setIsEditingName] = useState(!profile.name);
  const [showCredits, setShowCredits] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreatingNewProfile, setIsCreatingNewProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim().slice(0, 15);
    if (!cleaned) {
      audio.playError();
      return;
    }

    // Block entry if name is already taken by another local profile
    const exists = storageService.loadAllProfiles().some(
      p => p.name.toLowerCase() === cleaned.toLowerCase() && p.name.toLowerCase() !== (profile.name || '').toLowerCase()
    );
    if (exists) {
      audio.playError();
      alert(isPt ? 'Este apelido já está sendo usado por outro jogador!' : 'This nickname is already in use by another player!');
      return;
    }

    audio.playSuccess();
    onUpdateProfileName(cleaned);
    setIsEditingName(false);
  };

  const hasProgress = Object.keys(profile.levelProgress).length > 0;

  const selectedTheme = profile.selectedTheme || 'classic';
  const isClassicTheme = selectedTheme === 'classic';
  const themeDetails = getThemeDetails(selectedTheme, isPt);

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto relative text-white">
      {/* Dynamic Theme Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${themeDetails.gradient} transition-all duration-1000 z-0`} />
      <ThemeParticles theme={selectedTheme as any} />
      
      {/* Top Banner Player Info / Minimalist Header */}
      <header className={`h-16 w-full flex items-center justify-between px-6 border-b z-10 shrink-0 backdrop-blur-md ${
        isClassicTheme ? 'border-zinc-850 bg-zinc-900/60' : 'border-white/10 bg-black/40'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
            isClassicTheme ? 'bg-zinc-800 border-zinc-750' : 'bg-white/10 border-white/10'
          }`}>
            <span className="text-base font-black text-white font-display">N</span>
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-white font-display">
              Nuts & Colors
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isEditingName && profile.name ? (
            <button
              onClick={() => {
                audio.playClick();
                setIsEditingName(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[11px] font-bold border ${
                isClassicTheme 
                  ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700/60 text-zinc-300' 
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
              }`}
            >
              <User size={11} className={isClassicTheme ? 'text-zinc-400' : 'text-zinc-300'} />
              <span className="truncate max-w-[80px]">{profile.name}</span>
            </button>
          ) : null}

          <button
            onClick={() => {
              audio.playClick();
              onNavigate('config');
            }}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all border ${
              isClassicTheme 
                ? 'bg-zinc-800 border-zinc-700/60 hover:bg-zinc-750 text-zinc-300' 
                : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
            }`}
            title={isPt ? 'Configurações' : 'Settings'}
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between p-6 z-10">
        
        {/* Shop and Daily Reward Action Bar - Discrete styling */}
        {profile.name && (
          <div className={`mb-4 rounded-2xl p-2.5 flex items-center justify-between shadow-md gap-2 border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-800' : 'bg-black/30 border-white/10'
          }`}>
            {/* Coins Balance */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
              isClassicTheme ? 'bg-zinc-950 border-zinc-850' : 'bg-black/40 border-white/5'
            }`}>
              <span className="text-xs text-amber-500">🪙</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-white font-mono leading-none">
                  {profile.coins ?? 200}
                </span>
                <span className="text-[7px] uppercase tracking-wider text-zinc-400 font-bold">
                  {isPt ? 'Moedas' : 'Coins'}
                </span>
              </div>
            </div>

            {/* Shop and Daily Reward buttons */}
            <div className="flex items-center gap-2">
              {/* Theme Shop Button */}
              <button
                onClick={() => {
                  audio.playClick();
                  setShowShop(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all text-[11px] font-bold border ${
                  isClassicTheme 
                    ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700/60 text-zinc-200' 
                    : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                }`}
              >
                <ShoppingBag size={11} className={isClassicTheme ? 'text-zinc-400' : 'text-zinc-300'} />
                <span>{isPt ? 'Temas' : 'Themes'}</span>
              </button>

              {/* Daily Reward Button */}
              {!profile.lastDailyRewardClaimed || new Date(profile.lastDailyRewardClaimed).toDateString() !== new Date().toDateString() ? (
                <button
                  onClick={() => {
                    audio.playSuccess();
                    const amount = Math.floor(Math.random() * 101) + 50; // 50 to 150 coins
                    const updated = {
                      ...profile,
                      coins: (profile.coins ?? 200) + amount,
                      lastDailyRewardClaimed: new Date().toISOString()
                    };
                    storageService.saveProfile(updated);
                    if (onSwitchProfile) {
                      onSwitchProfile(updated);
                    }
                    setClaimedAmount(amount);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all text-[11px] font-bold shadow-sm ${
                    isClassicTheme 
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-950' 
                      : 'bg-white hover:bg-white/90 text-black'
                  }`}
                >
                  <Gift size={11} />
                  <span>{isPt ? 'Bônus' : 'Claim'}</span>
                </button>
              ) : (
                <div className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold flex items-center gap-1 cursor-not-allowed ${
                  isClassicTheme ? 'bg-zinc-950 border-zinc-850 text-zinc-600' : 'bg-black/20 border-white/5 text-zinc-500'
                }`}>
                  <Check size={10} />
                  <span>{isPt ? 'Coletado' : 'Claimed'}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Center Logo Area */}
        <div className="my-2 text-center flex flex-col items-center">
          {/* Stack of stationary nuts in perspective pseudo-3D - no movement */}
          <div className="relative h-28 w-36 flex flex-col items-center justify-center mb-3">
            <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-md">
              {/* Bottom Nut */}
              <g transform="translate(10, 42)">
                <polygon
                  points="70,10 110,25 110,45 70,60 30,45 30,25"
                  fill="#3f3f46"
                  stroke="#18181b"
                  strokeWidth="2.5"
                />
                <ellipse cx="70" cy="35" rx="18" ry="9" fill="#18181b" />
              </g>
              {/* Middle Nut */}
              <g transform="translate(5, 21)">
                <polygon
                  points="70,10 110,25 110,45 70,60 30,45 30,25"
                  fill="#52525b"
                  stroke="#27272a"
                  strokeWidth="2.5"
                />
                <ellipse cx="70" cy="35" rx="18" ry="9" fill="#18181b" />
              </g>
              {/* Top Nut */}
              <g transform="translate(0, 0)">
                <polygon
                  points="70,10 110,25 110,45 70,60 30,45 30,25"
                  fill="#71717a"
                  stroke="#3f3f46"
                  strokeWidth="2.5"
                />
                <ellipse cx="70" cy="35" rx="18" ry="9" fill="#18181b" />
              </g>
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black tracking-tight text-white uppercase font-display">
            Nuts & Colors
          </h1>
          <div className={`flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-800' : 'bg-black/30 border-white/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isClassicTheme ? 'bg-zinc-400' : `${themeDetails.accentText}`}`} />
            <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
              isClassicTheme ? 'text-zinc-400' : `${themeDetails.accentText}`
            }`}>
              {isPt ? 'Mestre das Cores' : 'Master Tier'}
            </span>
          </div>
        </div>

        {/* Interactive Name Entry (Locked overlay if editing name) */}
        <div className="my-4 flex-1 flex flex-col justify-center">
          {isEditingName ? (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSaveName}
              className="pro-card p-6 max-w-sm mx-auto w-full"
            >
              <div className="flex flex-col gap-1.5 mb-4 text-center">
                <span className="text-base font-bold text-white font-display uppercase tracking-tight">
                  {isPt ? 'Seja Bem-vindo!' : 'Welcome!'}
                </span>
                <span className="text-xs text-slate-400">
                  {isPt ? 'Insira seu apelido para salvar sua jornada:' : 'Enter your nickname to save your progress:'}
                </span>
              </div>

              <input
                type="text"
                required
                maxLength={15}
                placeholder={isPt ? 'Apelido...' : 'Nickname...'}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
              />

              <button
                type="submit"
                className="w-full mt-4 py-3.5 pro-button-primary text-xs"
              >
                {isPt ? 'Confirmar' : 'Save & Play'}
              </button>
            </motion.form>
          ) : (
            /* Main Actions Buttons */
            <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
              
              {/* Continuar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  audio.playClick();
                  onNavigate('game');
                }}
                className="group flex items-center justify-between p-4 rounded-2xl pro-button-primary cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/20 shadow-inner">
                    <Play size={22} fill="currentColor" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-sm tracking-wide">
                      {hasProgress ? (isPt ? 'Continuar Jogo' : 'Continue Game') : (isPt ? 'Jogar Agora' : 'Play Now')}
                    </span>
                    <span className="text-[10px] text-indigo-200 font-mono">
                      {isPt ? `Nível ${profile.lastPlayedLevel}` : `Level ${profile.lastPlayedLevel}`}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-900/40 border border-white/10 px-2.5 py-1 rounded-full shadow-md">
                  {isPt ? 'Iniciar' : 'Start'}
                </span>
              </motion.button>

              {/* Novo Jogo / Seletor */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    audio.playClick();
                    onNavigate('levels');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl pro-button-secondary text-slate-100"
                >
                  <Zap size={22} className="text-amber-400 mb-1.5 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                  <span className="text-[11px] tracking-wider uppercase font-bold">{isPt ? 'Níveis' : 'Levels'}</span>
                </button>

                <button
                  onClick={() => {
                    audio.playClick();
                    onNavigate('ranking');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl pro-button-secondary text-slate-100"
                >
                  <Trophy size={22} className="text-indigo-400 mb-1.5 drop-shadow-[0_0_10px_rgba(129,140,248,0.3)]" />
                  <span className="text-[11px] tracking-wider uppercase font-bold">{isPt ? 'Ranking' : 'Leaderboard'}</span>
                </button>
              </div>

              {/* Estatísticas & Configurações */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    audio.playClick();
                    onNavigate('stats');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl pro-button-secondary text-slate-100"
                >
                  <BarChart3 size={20} className="text-emerald-400 mb-1.5 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                  <span className="text-[11px] tracking-wider uppercase font-bold">{isPt ? 'Estatísticas' : 'Statistics'}</span>
                </button>

                <button
                  onClick={() => {
                    audio.playClick();
                    setShowProfileManager(true);
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl pro-button-secondary text-slate-100 border-indigo-500/10 hover:border-indigo-500/30 relative overflow-hidden"
                >
                  <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500 animate-ping" />
                  <User size={20} className="text-pink-500 mb-1.5 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]" />
                  <span className="text-[11px] tracking-wider uppercase font-bold">{isPt ? 'Perfis' : 'Profiles'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Credits & Help Information */}
        <div className={`flex items-center justify-between border-t pt-4 text-[11px] ${
          isClassicTheme ? 'border-zinc-850 text-zinc-500' : 'border-white/10 text-zinc-400'
        }`}>
          <span>Criado por Olavo Gaspar</span>
          <button
            onClick={() => {
              audio.playClick();
              setShowCredits(true);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors font-semibold"
          >
            <Info size={11} />
            {isPt ? 'Sobre' : 'About'}
          </button>
        </div>
      </div>

      {/* Credits Modal Popup */}
      <AnimatePresence>
        {showCredits && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm pro-card p-6 relative"
            >
              <h3 className="text-lg font-bold text-white mb-3 font-display uppercase tracking-tight">
                {isPt ? 'Sobre o Jogo' : 'About the Game'}
              </h3>
              
              <div className="space-y-3 text-xs text-zinc-400 leading-relaxed text-left">
                <p className="font-semibold text-zinc-300">
                  {isPt 
                    ? 'Nuts & Colors — Criado por Olavo Gaspar' 
                    : 'Nuts & Colors — Created by Olavo Gaspar'}
                </p>
                <p>
                  {isPt 
                    ? 'Um elegante quebra-cabeça de organização de porcas e parafusos coloridos com estética minimalista premium e mecânica refinada.' 
                    : 'An elegant color sorting game of nuts and bolts with premium minimalist aesthetic and refined mechanics.'}
                </p>
                <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl">
                  <strong className="text-white block mb-1 uppercase font-semibold text-[10px] tracking-wider">
                    {isPt ? 'Como Jogar:' : 'How to Play:'}
                  </strong>
                  <ul className="space-y-1 text-zinc-300">
                    <li>• {isPt ? 'Toque no parafuso para suspender a porca do topo.' : 'Tap bolt to hover the top nut.'}</li>
                    <li>• {isPt ? 'Toque no alvo para soltá-la.' : 'Tap target to drop.'}</li>
                    <li>• {isPt ? 'Porcas só empilham se forem da mesma cor.' : 'Nuts only stack if they match.'}</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => {
                  audio.playClick();
                  setShowCredits(false);
                }}
                className="w-full mt-5 py-3 pro-button-secondary text-xs"
              >
                {isPt ? 'Entendido' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real Player Database & Profile Manager Modal */}
      <AnimatePresence>
        {showProfileManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm pro-card p-6 relative max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => {
                  audio.playClick();
                  setShowProfileManager(false);
                  setIsCreatingNewProfile(false);
                  setNewProfileName('');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-white mb-1 font-display uppercase tracking-tight">
                {isPt ? 'Gerenciar Perfis' : 'Manage Profiles'}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">
                {isPt ? 'Banco de Dados de Jogadores' : 'Local Player Database'}
              </p>

              {/* Profiles List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
                {storageService.loadAllProfiles().map((p) => {
                  const isActive = p.name.toLowerCase() === profile.name.toLowerCase();
                  return (
                    <div
                      key={p.name}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (isActive) return;
                          audio.playSuccess();
                          const loaded = storageService.switchProfile(p.name);
                          if (loaded && onSwitchProfile) {
                            onSwitchProfile(loaded);
                          }
                          setShowProfileManager(false);
                        }}
                        className="flex-1 text-left flex flex-col"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs uppercase tracking-tight truncate max-w-[150px]">
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              {isPt ? 'Ativo' : 'Active'}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {isPt ? `Nível ${p.level} • ${p.xp} XP` : `Level ${p.level} • ${p.xp} XP`}
                        </span>
                      </button>

                      {/* Delete profile (only allowed if it's not the active one) */}
                      {!isActive && (
                        <button
                          onClick={() => {
                            audio.playClick();
                            if (confirm(isPt ? `Tem certeza de que deseja deletar o perfil ${p.name}?` : `Are you sure you want to delete profile ${p.name}?`)) {
                              storageService.deleteProfile(p.name);
                              // Trigger a force re-render by calling dummy state updater if needed, or simply let component refresh
                              setNewProfileName(prev => prev + ' '); 
                              setTimeout(() => setNewProfileName(''), 10);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={isPt ? 'Excluir Perfil' : 'Delete Profile'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create New Profile Form */}
              {isCreatingNewProfile ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleaned = newProfileName.trim().slice(0, 15);
                    if (!cleaned) return;
                    
                    // Check if name already exists
                    const exists = storageService.loadAllProfiles().some(p => p.name.toLowerCase() === cleaned.toLowerCase());
                    if (exists) {
                      audio.playError();
                      alert(isPt ? 'Este nome de perfil já existe!' : 'This profile name already exists!');
                      return;
                    }

                    audio.playSuccess();
                    const newProf = storageService.createNewProfile(cleaned);
                    if (onSwitchProfile) {
                      onSwitchProfile(newProf);
                    }
                    setIsCreatingNewProfile(false);
                    setNewProfileName('');
                    setShowProfileManager(false);
                  }}
                  className="pt-3 border-t border-slate-800"
                >
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-2">
                    {isPt ? 'Nome do Novo Jogador:' : 'New Player Nickname:'}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder={isPt ? 'Apelido...' : 'Nickname...'}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {isPt ? 'Criar' : 'Create'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    audio.playClick();
                    setIsCreatingNewProfile(true);
                  }}
                  className="w-full py-3 border border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 transition-all text-xs font-bold"
                >
                  <UserPlus size={14} />
                  <span>{isPt ? 'Adicionar Novo Jogador' : 'Add New Player'}</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Theme Shop Modal */}
      <AnimatePresence>
        {showShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg pro-card p-6 relative max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => {
                  audio.playClick();
                  setShowShop(false);
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="text-zinc-100" size={20} />
                <h3 className="text-base font-bold text-white font-display uppercase tracking-tight">
                  {isPt ? 'Galeria de Temas' : 'Theme Gallery'}
                </h3>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-4">
                {isPt ? 'Visualize o mockup completo de cada estilo antes de desbloquear' : 'Preview the full mockup of each style before unlocking'}
              </p>

              {/* Current Coins Indicator */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-400 font-semibold">{isPt ? 'Seu Saldo:' : 'Your Balance:'}</span>
                <span className="text-sm font-black text-amber-500 font-mono flex items-center gap-1">🪙 {profile.coins ?? 200}</span>
              </div>

              {/* Theme Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {[
                  {
                    id: 'classic',
                    namePt: 'Minimalista Neutro',
                    nameEn: 'Neutral Minimalist',
                    descPt: 'Estilo padrão em preto, branco e tons de cinza. Altíssima legibilidade e foco total no tabuleiro.',
                    descEn: 'Clean focus on black, white, and shades of gray. Ultimate clarity and gameplay concentration.',
                    cost: 0,
                    badgeTextPt: 'Incluso',
                    badgeTextEn: 'Included'
                  },
                  {
                    id: 'cyber',
                    namePt: 'Sombra Cyberpunk',
                    nameEn: 'Cyberpunk Shadow',
                    descPt: 'Visual noturno minimalista com cinza escuro, linhas cibernéticas sutis e detalhes em neon fúcsia sólido.',
                    descEn: 'Dark tech visual featuring subtle digital lines and highlights in solid deep fuchsia.',
                    cost: 300,
                    badgeTextPt: 'Sintético',
                    badgeTextEn: 'Synthetic'
                  },
                  {
                    id: 'wood',
                    namePt: 'Madeira Nórdica',
                    nameEn: 'Nordic Wood',
                    descPt: 'Madeira esculpida à mão em tons de cedro e nogueira, com porcas orgânicas em verde-floresta e terracota.',
                    descEn: 'Cozy carved cedar wood grain background paired with deep forest green and organic nut colors.',
                    cost: 500,
                    badgeTextPt: 'Artesanal',
                    badgeTextEn: 'Handcrafted'
                  },
                  {
                    id: 'lava',
                    namePt: 'Lava Vulcânica',
                    nameEn: 'Volcanic Lava',
                    descPt: 'Obsidiana escura com rios de lava pulsantes vermelhos e alaranjados e partículas de brasas.',
                    descEn: 'Dark obsidian base with pulsing red-orange lava rivers and warm ember floating particles.',
                    cost: 600,
                    badgeTextPt: 'Magmático',
                    badgeTextEn: 'Magmatic'
                  },
                  {
                    id: 'toxic',
                    namePt: 'Zona Tóxica',
                    nameEn: 'Toxic Wasteland',
                    descPt: 'Estilo perigo radioativo com ácido verde neon pulsante, bolhas químicas e placas de advertência.',
                    descEn: 'Radioactive danger aesthetic featuring pulsing neon green acid, bubbling chemicals, and warnings.',
                    cost: 750,
                    badgeTextPt: 'Instável',
                    badgeTextEn: 'Unstable'
                  },
                  {
                    id: 'stone',
                    namePt: 'Pedra Rúnica',
                    nameEn: 'Ancient Stone',
                    descPt: 'Granito rúnico robusto entalhado com runas cinzas, porcas minerais em tons foscos de ametista e jade.',
                    descEn: 'Ancient gray runic granite columns accompanied by solid matte sandstone, jade and amethyst nuts.',
                    cost: 800,
                    badgeTextPt: 'Mineral',
                    badgeTextEn: 'Mineral'
                  },
                  {
                    id: 'frost',
                    namePt: 'Gelo Nórdico',
                    nameEn: 'Frost Glacier',
                    descPt: 'Estilo glacial prateado e azulado com cristais de neve caindo, gelo fosco e ventos frios.',
                    descEn: 'Glacial silver and cold blue aesthetic with falling snow crystals, frosty ice, and cold winds.',
                    cost: 900,
                    badgeTextPt: 'Criogênico',
                    badgeTextEn: 'Cryogenic'
                  },
                  {
                    id: 'ocean',
                    namePt: 'Abismo Submarino',
                    nameEn: 'Deep Ocean',
                    descPt: 'Fundo do mar em azul-marinho profundo e ciano, com bolhas de ar subindo e bioluminescência.',
                    descEn: 'Deep navy and cyan sea bottom, with rising air bubbles and organic bioluminescent teal glow.',
                    cost: 1000,
                    badgeTextPt: 'Lendário',
                    badgeTextEn: 'Legendary'
                  },
                  {
                    id: 'solar',
                    namePt: 'Solar Imperial',
                    nameEn: 'Imperial Solar',
                    descPt: 'Ouro latão polido premium com constelações astronômicas sob fundo azul celeste. Demonstração de Alta Qualidade.',
                    descEn: 'Polished golden brass rods and celestial constellation maps set against deep imperial cosmic navy.',
                    cost: 1200,
                    badgeTextPt: 'Alta Qualidade',
                    badgeTextEn: 'High-Fidelity'
                  }
                ].map((item) => {
                  const isUnlocked = (profile.unlockedThemes ?? ['classic']).includes(item.id);
                  const isSelected = (profile.selectedTheme ?? 'classic') === item.id;

                  // Render detailed game mockup inside the item card
                  const renderThemeMockup = (themeId: string) => {
                    let bgClass = "bg-zinc-950";
                    let pegStyle = "bg-zinc-700";
                    let nutColors = ["bg-zinc-400", "bg-zinc-600", "bg-zinc-500"];
                    let nutBorder = "border-zinc-800";
                    let nutAddon = "rounded";

                    if (themeId === 'classic') {
                      bgClass = "bg-zinc-950 border border-zinc-850";
                      pegStyle = "bg-zinc-600";
                      nutColors = ["bg-zinc-300", "bg-zinc-400", "bg-zinc-500"];
                      nutBorder = "border-zinc-700/80";
                    } else if (themeId === 'cyber') {
                      bgClass = "bg-[#080314] border border-[#23123c]/40";
                      pegStyle = "bg-[#3b126c]";
                      nutColors = ["bg-fuchsia-500", "bg-cyan-500", "bg-fuchsia-600"];
                      nutBorder = "border-fuchsia-400/45";
                      nutAddon = "rounded-lg";
                    } else if (themeId === 'wood') {
                      bgClass = "bg-[#231710] border border-amber-950/40";
                      pegStyle = "bg-[#452818]";
                      nutColors = ["bg-emerald-600", "bg-orange-600", "bg-amber-600"];
                      nutBorder = "border-amber-900";
                      nutAddon = "rounded-md";
                    } else if (themeId === 'lava') {
                      bgClass = "bg-[#1a0604] border border-red-950/50";
                      pegStyle = "bg-[#e11d48]";
                      nutColors = ["bg-orange-600", "bg-red-600", "bg-amber-500"];
                      nutBorder = "border-orange-950";
                      nutAddon = "rounded-md";
                    } else if (themeId === 'toxic') {
                      bgClass = "bg-[#041208] border border-lime-950/50";
                      pegStyle = "bg-[#65a30d]";
                      nutColors = ["bg-lime-400", "bg-emerald-500", "bg-yellow-500"];
                      nutBorder = "border-lime-950";
                      nutAddon = "rounded-lg";
                    } else if (themeId === 'stone') {
                      bgClass = "bg-[#1c1e20] border border-stone-800";
                      pegStyle = "bg-stone-600";
                      nutColors = ["bg-stone-400", "bg-[#7c3aed]", "bg-emerald-600"];
                      nutBorder = "border-stone-800";
                      nutAddon = "rounded-sm";
                    } else if (themeId === 'frost') {
                      bgClass = "bg-[#0b1724] border border-sky-950/50";
                      pegStyle = "bg-[#0284c7]";
                      nutColors = ["bg-sky-200", "bg-sky-400", "bg-slate-300"];
                      nutBorder = "border-sky-300/40";
                      nutAddon = "rounded-md";
                    } else if (themeId === 'ocean') {
                      bgClass = "bg-[#02131a] border border-cyan-950/50";
                      pegStyle = "bg-[#0891b2]";
                      nutColors = ["bg-cyan-400", "bg-blue-600", "bg-teal-650"];
                      nutBorder = "border-cyan-950";
                      nutAddon = "rounded-md";
                    } else if (themeId === 'solar') {
                      bgClass = "bg-[#0c1424] border border-amber-500/20";
                      pegStyle = "bg-amber-500";
                      nutColors = ["bg-amber-400", "bg-blue-600", "bg-rose-600"];
                      nutBorder = "border-amber-400/55";
                      nutAddon = "rounded-md ring-1 ring-amber-400/20";
                    }

                    return (
                      <div className={`w-28 h-20 ${bgClass} rounded-xl p-1.5 flex flex-col justify-between shrink-0 overflow-hidden relative shadow-inner`}>
                        {/* Star decorations for Solar */}
                        {themeId === 'solar' && (
                          <div className="absolute inset-0 opacity-20 pointer-events-none text-[6px] text-amber-300 font-serif">
                            <span className="absolute top-1 right-2">✦</span>
                            <span className="absolute bottom-2 left-3">✦</span>
                          </div>
                        )}
                        {/* Mini HUD bar */}
                        <div className="flex justify-between items-center text-[5px] scale-[0.8] origin-left text-zinc-500 font-mono leading-none">
                          <span>LVL 12</span>
                          <span className="text-amber-400">🪙 140</span>
                        </div>
                        {/* Mini Board with 3 bolts */}
                        <div className="flex justify-around items-end h-12 px-1 gap-1">
                          {[0, 1, 2].map((boltIdx) => (
                            <div key={boltIdx} className="relative w-5 h-full flex flex-col items-center justify-end">
                              {/* Threaded peg */}
                              <div className={`absolute top-1.5 w-[3px] h-9 ${pegStyle} rounded-t-sm opacity-80`} />
                              {/* Nuts stack */}
                              <div className="flex flex-col-reverse gap-[1px] w-full z-10">
                                {boltIdx === 0 && (
                                  <>
                                    <div className={`h-[5px] w-full ${nutColors[0]} ${nutBorder} ${nutAddon} border-[0.5px]`} />
                                    <div className={`h-[5px] w-full ${nutColors[1]} ${nutBorder} ${nutAddon} border-[0.5px]`} />
                                  </>
                                )}
                                {boltIdx === 1 && (
                                  <div className={`h-[5px] w-full ${nutColors[2]} ${nutBorder} ${nutAddon} border-[0.5px]`} />
                                )}
                              </div>
                              {/* Base */}
                              <div className={`w-5 h-[2px] ${pegStyle} rounded-b-sm opacity-60`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  };
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'bg-zinc-800 border-zinc-100 shadow-md' 
                          : 'bg-zinc-900 border-zinc-850 hover:border-zinc-750'
                      }`}
                    >
                      {/* Left Block: Preview Mockup + Info */}
                      <div className="flex items-center gap-3.5 flex-1">
                        {renderThemeMockup(item.id)}
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white uppercase tracking-wider font-display">
                              {isPt ? item.namePt : item.nameEn}
                            </span>
                            <span className="text-[7px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                              {isPt ? item.badgeTextPt : item.badgeTextEn}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-400 leading-tight max-w-[210px] mt-1 font-sans">
                            {isPt ? item.descPt : item.descEn}
                          </span>
                        </div>
                      </div>

                      {/* Right Block: Actions */}
                      <div className="shrink-0 flex items-center justify-end">
                        {isSelected ? (
                          <span className="text-[9px] font-black uppercase text-zinc-900 bg-white border border-white px-2.5 py-1.5 rounded-xl">
                            {isPt ? 'Equipado' : 'Equipped'}
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => {
                              audio.playSuccess();
                              const updated = {
                                ...profile,
                                selectedTheme: item.id
                              };
                              storageService.saveProfile(updated);
                              if (onSwitchProfile) {
                                onSwitchProfile(updated);
                              }
                            }}
                            className="text-[9px] font-black uppercase text-white bg-zinc-800 hover:bg-zinc-750 px-3 py-2 rounded-xl border border-zinc-700 transition-colors"
                          >
                            {isPt ? 'Equipar' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const playerCoins = profile.coins ?? 200;
                              if (playerCoins < item.cost) {
                                audio.playError();
                                alert(isPt ? 'Moedas insuficientes para comprar este tema!' : 'Not enough coins to buy this theme!');
                                return;
                              }
                              audio.playSuccess();
                              const updated = {
                                ...profile,
                                coins: playerCoins - item.cost,
                                unlockedThemes: [...(profile.unlockedThemes ?? ['classic']), item.id],
                                selectedTheme: item.id
                              };
                              storageService.saveProfile(updated);
                              if (onSwitchProfile) {
                                onSwitchProfile(updated);
                              }
                            }}
                            className="text-[9px] font-black uppercase text-zinc-950 bg-amber-400 hover:bg-amber-300 px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span>🪙</span>
                            <span>{item.cost}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Claim Reward Success Modal */}
      <AnimatePresence>
        {claimedAmount !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-xs text-center pro-card p-6 border-emerald-500/30 relative"
            >
              <div className="h-16 w-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
                🎁
              </div>

              <h3 className="text-base font-black text-white font-display uppercase tracking-tight mb-1">
                {isPt ? 'Recompensa Resgatada!' : 'Reward Claimed!'}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-4">
                {isPt ? 'Sua recompensa diária chegou' : 'Your daily bonus has arrived'}
              </p>

              <div className="py-2.5 px-4 bg-slate-950/60 rounded-xl border border-slate-800 inline-flex items-center gap-1.5 text-base font-black font-mono text-yellow-400 mb-6 shadow-inner">
                <span>+ {claimedAmount}</span>
                <span>🪙</span>
              </div>

              <button
                onClick={() => {
                  audio.playClick();
                  setClaimedAmount(null);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition-colors"
              >
                {isPt ? 'Excelente!' : 'Awesome!'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
