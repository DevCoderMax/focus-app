import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Clipboard, FileJson, Layers, ListChecks } from 'lucide-react';
import { Button } from '@/components/Button';

const packageExample = `{
  "subjects": [
    {
      "name": "Matemática",
      "topics": [
        {
          "name": "Álgebra",
          "description": "Equações, expressões e funções algébricas.",
          "subtopics": [
            {
              "name": "Equações do 2º grau",
              "description": "Forma ax² + bx + c = 0, delta e raízes."
            },
            {
              "name": "Produtos notáveis"
            }
          ]
        },
        {
          "name": "Geometria plana",
          "description": "Áreas, perímetros e relações métricas.",
          "subtopics": [
            { "name": "Triângulos" },
            { "name": "Circunferência" }
          ]
        }
      ]
    },
    {
      "name": "Português",
      "topics": [
        {
          "name": "Interpretação de texto",
          "subtopics": [
            { "name": "Ideia central" },
            { "name": "Inferência" }
          ]
        }
      ]
    }
  ]
}`;

const minimalExample = `{
  "subjects": [
    {
      "name": "Direito Constitucional",
      "topics": [
        { "name": "Princípios fundamentais" },
        { "name": "Direitos e garantias fundamentais" }
      ]
    }
  ]
}`;

const rules = [
  'O arquivo precisa ser um JSON válido, sem comentários e sem vírgulas sobrando.',
  'A raiz do arquivo deve ter a chave "subjects" com uma lista de matérias.',
  'Cada matéria precisa ter "name".',
  'Cada tópico dentro de "topics" precisa ter "name".',
  'Subtópicos são opcionais, mas se existirem devem ficar dentro de "subtopics".',
  'Descrições são opcionais e podem ser usadas em matérias/tópicos/subtópicos suportados pelo importador.',
];

export function PackageGuidePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(packageExample);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-full bg-true-black text-true-white">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <Link
          to="/subjects"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-true-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar para Matérias
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-gray-800 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,#111,#050505)] p-8 md:p-10 mb-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.22em] text-gray-300 mb-5">
              <FileJson size={14} />
              Guia de pacote JSON
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Como montar um pacote importável
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Use pacotes para criar várias matérias, tópicos e subtópicos de uma vez. O FOCUS lê uma estrutura simples: matéria → tópicos → subtópicos.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Layers size={20} />
                Estrutura aceita
              </h2>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="rounded-xl border border-gray-800 bg-black p-4">
                  <div className="font-mono text-gray-100">subjects[]</div>
                  <p className="text-gray-500 mt-1">Lista de matérias.</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black p-4 ml-4">
                  <div className="font-mono text-gray-100">name</div>
                  <p className="text-gray-500 mt-1">Nome obrigatório da matéria.</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black p-4 ml-4">
                  <div className="font-mono text-gray-100">topics[]</div>
                  <p className="text-gray-500 mt-1">Lista opcional de tópicos daquela matéria.</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black p-4 ml-8">
                  <div className="font-mono text-gray-100">subtopics[]</div>
                  <p className="text-gray-500 mt-1">Lista opcional de subtópicos daquele tópico.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <ListChecks size={20} />
                Checklist antes de importar
              </h2>
              <ul className="space-y-3">
                {rules.map((rule) => (
                  <li key={rule} className="flex gap-3 text-sm text-gray-300">
                    <Check size={16} className="mt-0.5 text-white flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
              <h2 className="text-xl font-bold mb-3">Exemplo mínimo</h2>
              <pre className="overflow-auto rounded-xl bg-black border border-gray-800 p-4 text-xs text-gray-200 leading-relaxed">
                <code>{minimalExample}</code>
              </pre>
            </section>
          </div>

          <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold">Exemplo completo</h2>
                <p className="text-sm text-gray-500 mt-1">Copie, edite os nomes e importe como arquivo .json.</p>
              </div>
              <Button variant="secondary" onClick={handleCopy}>
                <Clipboard size={16} className="mr-2" />
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <pre className="max-h-[720px] overflow-auto rounded-xl bg-black border border-gray-800 p-5 text-sm text-gray-200 leading-relaxed shadow-inner">
              <code>{packageExample}</code>
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
