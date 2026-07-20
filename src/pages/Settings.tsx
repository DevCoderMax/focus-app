import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Download, Upload, Trash2 } from 'lucide-react';
import {
  clearAllData,
  exportData,
  downloadExport,
  validateImport,
  importDataReplace,
  importDataMerge,
  getImportSummary,
} from '@/services/importExportService';
import type { ExportData } from '@/types';

export function SettingsPage() {
  const { settings, updateSettings, loadAllData, refreshData } = useStore();
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleExport = async () => {
    const data = await exportData();
    downloadExport(data);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const validation = validateImport(json);

      if (!validation.valid) {
        alert(`Erro: ${validation.error}`);
        return;
      }

      setImportData(validation.data!);
    } catch (error) {
      alert('Erro ao ler arquivo. Verifique se é um JSON válido.');
    }
  };

  const handleImport = async () => {
    if (!importData) return;

    if (
      !confirm(
        importMode === 'replace'
          ? 'ATENÇÃO: Isso irá SUBSTITUIR todos os seus dados. Continuar?'
          : 'Isso irá mesclar os dados importados com os existentes. Continuar?'
      )
    ) {
      return;
    }

    setImporting(true);
    try {
      if (importMode === 'replace') {
        await importDataReplace(importData);
      } else {
        await importDataMerge(importData);
      }
      await refreshData();
      alert('Importação concluída com sucesso!');
      setImportData(null);
    } catch (error) {
      alert('Erro ao importar dados.');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  if (!settings) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Configurações</h1>
        <p className="text-gray-400">Personalize sua experiência</p>
      </div>

      {/* Preferences */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Preferências</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.disableProgressAnimations || false}
              onChange={(e) =>
                updateSettings({ disableProgressAnimations: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
            />
            <div>
              <p className="font-medium text-true-white">Desativar efeito pulsante do progresso</p>
              <p className="text-sm text-gray-400">Remove a animação de luz (brilho pulsante) de fundo no cabeçalho</p>
            </div>
          </label>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Backup & Restauração</h2>
        
        {/* Export */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Exportar dados</h3>
          <p className="text-sm text-gray-400 mb-3">
            Faça backup de todos os seus dados em formato JSON
          </p>
          <Button onClick={handleExport}>
            <Download size={20} className="mr-2" />
            Exportar Backup
          </Button>
        </div>

        {/* Import */}
        <div>
          <h3 className="font-medium mb-3">Importar dados</h3>
          <p className="text-sm text-gray-400 mb-3">
            Restaure ou mescle dados de um backup anterior
          </p>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <strong>Mesclar:</strong> Adicionar novos itens e atualizar
                  existentes se mais recentes
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <strong>Substituir:</strong> Deletar tudo e importar apenas os
                  dados do arquivo
                </span>
              </label>
            </div>

            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="inline-flex">
              <span className="inline-flex items-center justify-center font-medium transition-all duration-200 bg-true-white text-true-black hover:bg-gray-200 active:bg-gray-300 px-4 py-2 text-base rounded-lg">
                <Upload size={20} className="mr-2" />
                Escolher Arquivo
              </span>
            </label>

            {importData && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Resumo do arquivo:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {Object.entries(getImportSummary(importData)).map(
                    ([key, count]) => (
                      <li key={key}>
                        {key}: {count} item(s)
                      </li>
                    )
                  )}
                </ul>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'Importando...' : 'Confirmar Importação'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setImportData(null)}
                    disabled={importing}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900 rounded-lg p-6 border border-red-900">
        <h2 className="text-xl font-bold mb-4 text-red-500">Zona de Perigo</h2>
        <p className="text-sm text-gray-400 mb-4">
          Esta ação é irreversível. Faça backup antes de prosseguir.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            if (
              confirm(
                'ATENÇÃO: Isso irá deletar TODOS os seus dados permanentemente. Continuar?'
              )
            ) {
              if (confirm('Tem certeza absoluta? Esta ação não pode ser desfeita!')) {
                clearAllData()
                  .then(refreshData)
                  .then(() => {
                    alert('Todos os dados foram deletados.');
                  })
                  .catch((error) => {
                    console.error(error);
                    alert('Erro ao deletar dados.');
                  });
              }
            }
          }}
        >
          <Trash2 size={20} className="mr-2" />
          Deletar Todos os Dados
        </Button>
      </div>
    </div>
  );
}
