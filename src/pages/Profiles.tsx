import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AvatarSvg } from '@/components/AvatarSvg';
import type { Profile } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

// Avatar options (IDs only - SVGs are in AvatarSvg component)
const AVATAR_OPTIONS = [
  { id: 'scholar', name: 'Estudioso' },
  { id: 'ninja', name: 'Ninja' },
  { id: 'wizard', name: 'Mago' },
  { id: 'robot', name: 'Robô' },
  { id: 'cat', name: 'Gato' },
  { id: 'astronaut', name: 'Astronauta' },
  { id: 'fox', name: 'Raposa' },
  { id: 'panda', name: 'Panda' },
];

export function ProfilesPage() {
  const {
    profiles,
    activeProfileId,
    loadProfiles,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useStore();
  const navigate = useNavigate();
  const [isManaging, setIsManaging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSave = () => {
    if (!profileName.trim()) return;
    if (editingProfile) {
      updateProfile({ ...editingProfile, name: profileName.trim(), avatar: selectedAvatar });
    } else {
      createProfile(profileName.trim(), selectedAvatar);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProfile(null);
    setProfileName('');
    setSelectedAvatar(AVATAR_OPTIONS[0].id);
  };

  const openEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileName(profile.name);
    setSelectedAvatar(profile.avatar || AVATAR_OPTIONS[0].id);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingProfile(null);
    setProfileName('');
    setSelectedAvatar(AVATAR_OPTIONS[0].id);
    setShowModal(true);
  };

  const handleSelectProfile = (profileId: string) => {
    setActiveProfile(profileId);
    navigate('/');
  };

  const handleDelete = () => {
    if (editingProfile && confirm(`Excluir o perfil "${editingProfile.name}"?`)) {
      deleteProfile(editingProfile.id);
      closeModal();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col items-center justify-center p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            FOCUS
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-light">
            {isManaging ? 'Gerenciar Perfis' : 'O que está estudando?'}
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {profiles.map((profile) => (
            <div key={profile.id} className="relative group">
              <button
                type="button"
                onClick={() => isManaging ? openEdit(profile) : handleSelectProfile(profile.id)}
                className={`w-full flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  activeProfileId === profile.id && !isManaging
                    ? 'border-white bg-white/10 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
                }`}
              >
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-800 shadow-xl group-hover:shadow-2xl transition-shadow relative">
                  <AvatarSvg avatarId={profile.avatar} />
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Pencil className="text-white w-8 h-8" />
                    </div>
                  )}
                </div>
                <span className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                  {profile.name}
                </span>
              </button>
            </div>
          ))}

          {/* Add Profile Button */}
          <button
            type="button"
            onClick={openCreate}
            className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
          >
            <div className="w-28 h-28 rounded-2xl bg-gray-800/50 flex items-center justify-center group-hover:bg-gray-700/50 transition-colors">
              <Plus className="w-12 h-12" />
            </div>
            <span className="text-lg font-medium">Adicionar perfil</span>
          </button>
        </div>

        {/* Manage Profiles Button */}
        {profiles.length > 0 && (
          <div className="text-center">
            <Button
              variant={isManaging ? "primary" : "secondary"}
              onClick={() => setIsManaging(!isManaging)}
              className="px-8 py-3 text-lg"
            >
              {isManaging ? 'Concluir' : 'Gerenciar perfis'}
            </Button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl relative">
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6 text-center">
                {editingProfile ? 'Editar perfil' : 'Criar novo perfil'}
              </h2>

              {/* Avatar Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Escolha seu avatar
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-2 rounded-xl border-2 transition-all ${
                        selectedAvatar === avatar.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden">
                        <AvatarSvg avatarId={avatar.id} />
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">{avatar.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <Input
                label="Nome do perfil"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Ex: João, Estudos, Concurso..."
              />

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-6">
                <Button onClick={handleSave} className="w-full py-4 text-lg">
                  {editingProfile ? 'Salvar Alterações' : 'Criar Perfil'}
                </Button>
                
                <div className="flex gap-3">
                  {editingProfile && (
                    <Button
                      variant="ghost"
                      onClick={handleDelete}
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={18} className="mr-2" />
                      Excluir
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={closeModal}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
