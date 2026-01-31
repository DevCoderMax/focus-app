import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { Profile } from '@/types';
import { useNavigate } from 'react-router-dom';

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
  const [creating, setCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSave = () => {
    if (!profileName.trim()) return;
    if (editingProfile) {
      updateProfile({ ...editingProfile, name: profileName.trim() });
    } else {
      createProfile(profileName.trim());
    }
    setProfileName('');
    setCreating(false);
    setEditingProfile(null);
  };

  return (
    <div className="min-h-screen bg-true-black text-true-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">Quem está estudando?</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                setActiveProfile(profile.id);
                navigate('/');
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-colors ${
                activeProfileId === profile.id
                  ? 'border-true-white bg-gray-900'
                  : 'border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center text-3xl">
                {profile.avatar || '👤'}
              </div>
              <span className="text-sm font-medium">{profile.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingProfile(null);
              setProfileName('');
            }}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-true-white hover:border-gray-500"
          >
            <div className="w-20 h-20 rounded-xl bg-gray-900 flex items-center justify-center text-3xl">+</div>
            <span className="text-sm">Adicionar perfil</span>
          </button>
        </div>

        <div className="text-center">
          <Button
            variant="secondary"
            onClick={() => {
              setCreating((prev) => !prev);
              setEditingProfile(null);
              setProfileName('');
            }}
          >
            Gerenciar perfis
          </Button>
        </div>

        {(creating || editingProfile) && (
          <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">
                {editingProfile ? 'Editar perfil' : 'Novo perfil'}
              </h2>
              <Input
                label="Nome"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Nome do perfil"
              />
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSave}>{editingProfile ? 'Salvar' : 'Criar'}</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setEditingProfile(null);
                    setProfileName('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm text-gray-500 mb-3">Editar / remover</h3>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg"
                >
                  <span>{profile.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProfile(profile);
                        setProfileName(profile.name);
                        setCreating(false);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Excluir este perfil?')) {
                          deleteProfile(profile.id);
                        }
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
