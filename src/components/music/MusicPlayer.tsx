import { useState, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Music, ChevronUp, ChevronDown, Repeat } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  icon: string;
  videoIds: string[];
}

const STORAGE_KEY = 'focus.musicPlayer';

const playlists: Playlist[] = [
  {
    id: 'concentracao',
    name: 'Concentração',
    icon: '🎯',
    videoIds: [
      '2OEL4P1Rz04',
      'CjB_oVeq8Lo',
      'lTRiuFIWV54',
      '7jMlHT7p08A',
      'PIhIc_ehSdU',
    ],
  },
  {
    id: 'foco',
    name: 'Foco',
    icon: '🧠',
    videoIds: [
      '6B7PqW2NKeQ',
      'jfKfPfyJRdk',
      'lTRiuFIWV54',
      '2OEL4P1Rz04',
      'CjB_oVeq8Lo',
      'SLS9tUa2GXI',
    ],
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    icon: '🌙',
    videoIds: [
      'oAGWFop_Hx8',
      'BTYAsjAVa3I',
    ],
  },
  {
    id: 'lofi-live',
    name: 'Lo-Fi Live',
    icon: '📺',
    videoIds: [
      'X4VbdwhkE10',
      'E2vONfzoyRI',
      'VAlMDl00mYY',
    ],
  },
  {
    id: 'deep',
    name: 'Deep',
    icon: '🌊',
    videoIds: [
      'gdyegr9Yqh8',
      '-op8KhsehkI',
      'oztC9D43YxU',
      '3Yx4dv7KodA',
      'l_nZO3JVaq8',
      'Q5bDzSwLE8w',
      '2OEL4P1Rz04',
    ],
  },
  {
    id: 'classica',
    name: 'Clássica',
    icon: '🎻',
    videoIds: [
      'yebh32JSs9g',
      'OqqCctAhISQ',
      'GcEgMFLU0-4',
      'iqr3khMncqM',
      'crZtuAqWzs8',
    ],
  },
  {
    id: 'natureza',
    name: 'Natureza',
    icon: '🌿',
    videoIds: [
      '-wPg1tNEWmo',
      'eKFTssKCnsE',
      'V1bFr2SWP1J',
      '2OEL4P1Rz04',
      'CjB_oVeq8Lo',
    ],
  },
  {
    id: 'inspiracao',
    name: 'Inspiração',
    icon: '✨',
    videoIds: [
      '1fpNs9qLOhs',
      '3Tb0NWTVtqE',
      '2MWVuCsVdiw',
      'jbwFDchsvBY',
      'xSXzw1XiDVw',
    ],
  },
  {
    id: 'relax',
    name: 'Relax',
    icon: '😌',
    videoIds: [
      'CcAV71mXg_8',
      'Uu3dshFseaU',
      'ray1Svv6Sl8',
      'TaXlw0OmSOg',
      'DhHGDOgjie4',
      'l0Nat5LK8yI',
      'Uqq8_gNsCZg',
    ],
  },
];

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const playlist = playlists.find(p => p.id === parsed.playlistId) || playlists[0];
      return {
        playlist,
        videoIndex: parsed.videoIndex ?? Math.floor(Math.random() * playlist.videoIds.length),
        volume: parsed.volume ?? 0.5,
        isMuted: parsed.isMuted ?? false,
        isLooping: parsed.isLooping ?? false,
      };
    }
  } catch {}
  return null;
}

export function MusicPlayer() {
  const saved = loadState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(saved?.playlist || playlists[0]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(saved?.videoIndex ?? 
    Math.floor(Math.random() * (saved?.playlist || playlists[0]).videoIds.length)
  );
  const [volume, setVolume] = useState(saved?.volume ?? 0.5);
  const [isMuted, setIsMuted] = useState(saved?.isMuted ?? false);
  const [isLooping, setIsLooping] = useState(saved?.isLooping ?? false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  

  const currentVideoId = currentPlaylist.videoIds[currentVideoIndex];
  const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;

  // Listen for events from store
  useEffect(() => {
    const handleSetPlaylist = (e: CustomEvent) => {
      const playlist = playlists.find(p => p.id === e.detail.playlistId);
      if (playlist) {
        if (isPlaying) {
          crossfade(() => {
            setCurrentPlaylist(playlist);
            const randomIndex = Math.floor(Math.random() * playlist.videoIds.length);
            setCurrentVideoIndex(randomIndex);
          });
        } else {
          setCurrentPlaylist(playlist);
          const randomIndex = Math.floor(Math.random() * playlist.videoIds.length);
          setCurrentVideoIndex(randomIndex);
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    window.addEventListener('music-set-playlist', handleSetPlaylist as EventListener);
    window.addEventListener('music-play', handlePlay);
    window.addEventListener('music-pause', handlePause);

    return () => {
      window.removeEventListener('music-set-playlist', handleSetPlaylist as EventListener);
      window.removeEventListener('music-play', handlePlay);
      window.removeEventListener('music-pause', handlePause);
    };
  }, [isPlaying]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      playlistId: currentPlaylist.id,
      videoIndex: currentVideoIndex,
      volume,
      isMuted,
      isLooping,
    }));
  }, [currentPlaylist.id, currentVideoIndex, volume, isMuted, isLooping]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume / 100);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const crossfade = (callback: () => void) => {
    if (isFading) return;
    setIsFading(true);
    
    const startVolume = isMuted ? 0 : volume;
    const fadeOutSteps = 10;
    const fadeInSteps = 10;
    const stepTime = 50;
    let step = 0;
    
    // Fade out
    const fadeOut = setInterval(() => {
      step++;
      const newVol = startVolume * (1 - step / fadeOutSteps);
      setVolume(Math.max(0, newVol));
      
      if (step >= fadeOutSteps) {
        clearInterval(fadeOut);
        callback();
        
        // Fade in after brief pause
        setTimeout(() => {
          let fadeStep = 0;
          const fadeIn = setInterval(() => {
            fadeStep++;
            const newVol = startVolume * (fadeStep / fadeInSteps);
            setVolume(Math.min(startVolume, newVol));
            
            if (fadeStep >= fadeInSteps) {
              clearInterval(fadeIn);
              setIsFading(false);
            }
          }, stepTime);
        }, 200);
      }
    }, stepTime);
  };

  const selectPlaylist = (playlist: Playlist) => {
    if (isPlaying) {
      crossfade(() => {
        setCurrentPlaylist(playlist);
        const randomIndex = Math.floor(Math.random() * playlist.videoIds.length);
        setCurrentVideoIndex(randomIndex);
      });
    } else {
      setCurrentPlaylist(playlist);
      const randomIndex = Math.floor(Math.random() * playlist.videoIds.length);
      setCurrentVideoIndex(randomIndex);
    }
    setShowPlaylistSelector(false);
  };

  const nextTrack = () => {
    if (isPlaying) {
      crossfade(() => {
        const randomIndex = Math.floor(Math.random() * currentPlaylist.videoIds.length);
        setCurrentVideoIndex(randomIndex);
      });
    } else {
      const randomIndex = Math.floor(Math.random() * currentPlaylist.videoIds.length);
      setCurrentVideoIndex(randomIndex);
    }
  };

  const prevTrack = () => {
    if (isPlaying) {
      crossfade(() => {
        const randomIndex = Math.floor(Math.random() * currentPlaylist.videoIds.length);
        setCurrentVideoIndex(randomIndex);
      });
    } else {
      const randomIndex = Math.floor(Math.random() * currentPlaylist.videoIds.length);
      setCurrentVideoIndex(randomIndex);
    }
  };

  const handleEnded = useCallback(() => {
    if (isLooping) {
      setRestartKey((k) => k + 1);
    } else {
      nextTrack();
    }
  }, [currentPlaylist.videoIds.length, isLooping, isPlaying]);

  return (
    <div className="relative">
      {/* Hidden React Player */}
      <div className="hidden">
        <ReactPlayer
          key={restartKey}
          src={videoUrl}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          onEnded={handleEnded}
          width="100%"
          height="100%"

        />
      </div>

      {/* Playlist Selector Dropdown */}
      {showPlaylistSelector && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <p className="text-xs text-gray-400 mb-2 px-2">Estilo de estudo</p>
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => selectPlaylist(playlist)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                currentPlaylist.id === playlist.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{playlist.icon}</span>
              <span>{playlist.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Player UI */}
      <div className={`border-t border-gray-800 transition-all duration-200 ${
        isExpanded ? 'bg-gray-900/50' : 'bg-transparent hover:bg-gray-900/30'
      }`}>
        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{currentPlaylist.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Tocando agora</p>
                  <p className="text-sm text-white truncate">{currentPlaylist.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800"
              >
                Trocar
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={14} />
                ) : (
                  <Volume2 size={14} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume * 100}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <span className="text-xs text-gray-500 w-8 text-right">
                {isMuted ? 0 : Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Collapsed Player Bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Music size={14} />
            {!isExpanded && (
              <span className="text-xs truncate max-w-[100px]">
                {currentPlaylist.name}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={prevTrack}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Anterior"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button
              onClick={togglePlay}
              className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
              title={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>
            
            <button
              onClick={nextTrack}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Próxima"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1 transition-colors ${
                isLooping ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
              title={isLooping ? 'Desligar loop' : 'Repetir música'}
            >
              <Repeat size={12} />
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
