
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
    getPortfolio,
    getImageUrl,
    getProjectAttachments
} from '../services/api.js';

function Portfolio() {
    const { id } = useParams();

    const [portfolio, setPortfolio] = useState(null);
    const [projectAttachments, setProjectAttachments] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadPortfolio() {
            try {
                setLoading(true);
                setError('');

                const data = await getPortfolio(id);

                if (cancelled) return;

                setPortfolio(data);

                const projects = data.projetosSENAI || [];

                const results = await Promise.all(
                    projects.map(async (project) => {
                        try {
                            const attachments = await getProjectAttachments(
                                project.id
                            );

                            return [project.id, attachments];
                        } catch (error) {
                            console.error(
                                `Erro ao carregar anexos do projeto ${project.id}:`,
                                error
                            );

                            return [project.id, []];
                        }
                    })
                );

                if (!cancelled) {
                    setProjectAttachments(
                        Object.fromEntries(results)
                    );
                }

            } catch (error) {
                if (!cancelled) {
                    setError(error.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadPortfolio();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return <p>Carregando portfólio...</p>;
    }

    if (error) {
        return <p>Erro: {error}</p>;
    }

    if (!portfolio) {
        return <p>Portfólio não encontrado.</p>;
    }

    return (
        <main>
            <section>
                <h1>Sobre Mim</h1>

                {portfolio.foto_perfil && (
                    <img
                        src={getImageUrl(portfolio.foto_perfil)}
                        alt="Foto de perfil"
                        width="200"
                    />
                )}

                <h2>{portfolio.name}</h2>

                <h3>Itinerário</h3>
                <p>{portfolio.itinerario || 'Não informado'}</p>

                <h3>Turma</h3>
                <p>{portfolio.turma || 'Não informada'}</p>

                <h3>Apresentação</h3>
                <p>{portfolio.apresentacao || 'Não informada'}</p>

                <h3>Reflexão anual</h3>
                <p>{portfolio.reflexao_anual || 'Não informada'}</p>
            </section>

            <section>
                <h2>Projetos SENAI</h2>

                {!portfolio.projetosSENAI?.length ? (
                    <p>Este portfólio ainda não possui projetos.</p>
                ) : (
                    portfolio.projetosSENAI.map(project => (
                        <article key={project.id}>
                            <h3>{project.titulo}</h3>

                            <p>
                                <strong>Informação:</strong>{' '}
                                {project.informacao || 'Não informado'}
                            </p>

                            <p>
                                <strong>Descrição:</strong>{' '}
                                {project.descricao || 'Não informado'}
                            </p>

                            <p>
                                <strong>Relatórios técnicos:</strong>{' '}
                                {project.relatorios_tecnicos || 'Não informado'}
                            </p>

                            <p>
                                <strong>Aprendizagens:</strong>{' '}
                                {project.aprendizagens || 'Não informado'}
                            </p>

                            <p>
                                <strong>Competências:</strong>{' '}
                                {project.competencias || 'Não informado'}
                            </p>

                            <p>
                                <strong>Autoavaliação:</strong>{' '}
                                {project.autoavaliacao || 'Não informado'}
                            </p>

                            <div>
                                <h4>Anexos</h4>

                                {(projectAttachments[project.id] || []).length === 0 ? (
                                    <p>Nenhum anexo disponível.</p>
                                ) : (
                                    projectAttachments[project.id].map(attachment => (
                                        <div key={attachment.id}>
                                            {attachment.tipo?.startsWith('image/') && (
                                                <img
                                                    src={getImageUrl(attachment.url)}
                                                    alt={attachment.nome}
                                                    width="200"
                                                />
                                            )}

                                            <p>
                                                <a
                                                    href={getImageUrl(attachment.url)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {attachment.nome}
                                                </a>
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
}

export default Portfolio;
