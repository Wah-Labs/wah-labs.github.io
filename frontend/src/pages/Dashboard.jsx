
import { useEffect, useState } from 'react';
import {
    getMyPortfolio,
    updateAboutMe,
    getImageUrl,
    uploadProfilePicture,
    createSenaiProject,
    updateSenaiProject,
    deleteSenaiProject,
    uploadProjectAttachment,
    getProjectAttachments
} from '../services/api.js';

function Dashboard({ user, onLogout }) {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [projectAttachments, setProjectAttachments] = useState({});
    const [attachmentFeedback, setAttachmentFeedback] = useState({});
    const [attachmentFiles, setAttachmentFiles] = useState({});
    const [uploadingAttachmentId, setUploadingAttachmentId] = useState(null);
    const [message, setMessage] = useState('');
    const [editing, setEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const emptyProject = {
        titulo: '',
        informacao: '',
        descricao: '',
        relatorios_tecnicos: '',
        aprendizagens: '',
        competencias: '',
        autoavaliacao: ''
    };

    const [editingProjectId, setEditingProjectId] = useState(null);

    const [editingProjectForm, setEditingProjectForm] = useState({
        titulo: '',
        informacao: '',
        descricao: '',
        relatorios_tecnicos: '',
        aprendizagens: '',
        competencias: '',
        autoavaliacao: ''
    });

    const [projectForm, setProjectForm] = useState(emptyProject);
    const [creatingProject, setCreatingProject] = useState(false);

    const [form, setForm] = useState({
        itinerario: '',
        turma: '',
        apresentacao: '',
        reflexao_anual: ''
    });

    // Load attachments whenever the portfolio changes
    useEffect(() => {
        if (!portfolio?.projetosSENAI) return;

        async function loadAttachments() {
            try {
                const results = await Promise.all(
                    portfolio.projetosSENAI.map(async (project) => {
                        const attachments = await getProjectAttachments(project.id);
                        return [project.id, attachments];
                    })
                );

                setProjectAttachments(Object.fromEntries(results));
            } catch (error) {
                console.error('Erro ao carregar anexos:', error);
            }
        }

        loadAttachments();
    }, [portfolio]);

    // Load portfolio
    useEffect(() => {
        async function loadPortfolio() {
            try {
                const data = await getMyPortfolio();

                setPortfolio(data);

                setForm({
                    itinerario: data.itinerario || '',
                    turma: data.turma || '',
                    apresentacao: data.apresentacao || '',
                    reflexao_anual: data.reflexao_anual || ''
                });
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadPortfolio();
    }, []);

    function handleProjectChange(event) {
        const { name, value } = event.target;

        setProjectForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    function handleAttachmentChange(event, projectId) {
        const file = event.target.files[0] || null;

        setAttachmentFiles(previous => ({
            ...previous,
            [projectId]: file
        }));
    }

    // Upload attachment and refresh its list
    async function handleAttachmentUpload(event, projectId) {
        event.preventDefault();

        const uploadForm = event.currentTarget;
        const file = attachmentFiles[projectId];

        if (!file) {
            setAttachmentFeedback(previous => ({
                ...previous,
                [projectId]: 'Selecione um arquivo primeiro.'
            }));
            return;
        }

        setAttachmentFeedback(previous => ({
            ...previous,
            [projectId]: 'Enviando arquivo...'
        }));

        setUploadingAttachmentId(projectId);

        try {
            await uploadProjectAttachment(projectId, file);

            // Fetch updated attachments
            const attachments = await getProjectAttachments(projectId);

            setProjectAttachments(previous => ({
                ...previous,
                [projectId]: attachments
            }));

            setAttachmentFeedback(previous => ({
                ...previous,
                [projectId]: 'Arquivo enviado com sucesso!'
            }));

            setAttachmentFiles(previous => ({
                ...previous,
                [projectId]: null
            }));

            uploadForm.reset();

        } catch (error) {
            console.error('Erro no upload:', error);

            setAttachmentFeedback(previous => ({
                ...previous,
                [projectId]: `Erro: ${error.message}`
            }));
        } finally {
            setUploadingAttachmentId(null);
        }
    }

    function handleEditProject(project) {
        setEditingProjectId(project.id);

        setEditingProjectForm({
            titulo: project.titulo || '',
            informacao: project.informacao || '',
            descricao: project.descricao || '',
            relatorios_tecnicos: project.relatorios_tecnicos || '',
            aprendizagens: project.aprendizagens || '',
            competencias: project.competencias || '',
            autoavaliacao: project.autoavaliacao || ''
        });
    }

    function handleEditProjectChange(event) {
        const { name, value } = event.target;

        setEditingProjectForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleEditProjectSubmit(event) {
        event.preventDefault();

        setError('');
        setMessage('');

        try {
            await updateSenaiProject(editingProjectId, editingProjectForm);

            const updatedPortfolio = await getMyPortfolio();
            setPortfolio(updatedPortfolio);

            setEditingProjectId(null);
            setMessage('Projeto atualizado com sucesso!');
        } catch (error) {
            setError(error.message);
        }
    }

    async function handleProjectSubmit(event) {
        event.preventDefault();

        setError('');
        setMessage('');
        setCreatingProject(true);

        try {
            await createSenaiProject(projectForm);

            const updatedPortfolio = await getMyPortfolio();
            setPortfolio(updatedPortfolio);

            setProjectForm(emptyProject);
            setMessage('Projeto criado com sucesso!');
        } catch (error) {
            setError(error.message);
        } finally {
            setCreatingProject(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSave(event) {
        event.preventDefault();

        setError('');
        setMessage('');
        setSaving(true);

        try {
            await updateAboutMe(form);

            setPortfolio(previous => ({
                ...previous,
                ...form
            }));

            setEditing(false);
            setMessage('Informações atualizadas com sucesso!');
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteProject(id) {
        const confirmed = window.confirm(
            'Tem certeza de que deseja excluir este projeto?'
        );

        if (!confirmed) return;

        setError('');
        setMessage('');

        try {
            await deleteSenaiProject(id);

            const updatedPortfolio = await getMyPortfolio();
            setPortfolio(updatedPortfolio);

            setMessage('Projeto excluído com sucesso!');
        } catch (error) {
            setError(error.message);
        }
    }

    async function handlePhotoUpload(event) {
        event.preventDefault();

        const uploadForm = event.currentTarget;

        if (!selectedFile) {
            setError('Selecione uma imagem primeiro.');
            return;
        }

        setError('');
        setMessage('');
        setUploading(true);

        try {
            await uploadProfilePicture(selectedFile);

            const updatedPortfolio = await getMyPortfolio();
            setPortfolio(updatedPortfolio);

            setSelectedFile(null);
            uploadForm.reset();

            setMessage('Foto de perfil atualizada com sucesso!');
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    }

    if (loading) return <p>Carregando dashboard...</p>;
    if (error && !portfolio) return <p>Erro: {error}</p>;

    return (
        <main>
            <header>
                <h1>Dashboard</h1>
                <p>Bem-vindo, {user.name}!</p>
                <button onClick={onLogout}>Sair</button>
            </header>

            {message && <p>{message}</p>}
            {error && <p>Erro: {error}</p>}

            <section>
                <h2>Foto de perfil</h2>

                {portfolio.foto_perfil ? (
                    <img
                        src={getImageUrl(`/api/portfolio/${portfolio.id}/foto`)}
                        alt="Foto de perfil"
                        width="150"
                    />
                ) : (
                    <p>Nenhuma foto cadastrada.</p>
                )}

                <form onSubmit={handlePhotoUpload}>
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        onChange={event => {
                            setSelectedFile(event.target.files[0] || null);
                        }}
                    />

                    <button type="submit" disabled={uploading || !selectedFile}>
                        {uploading ? 'Enviando...' : 'Enviar foto'}
                    </button>
                </form>
            </section>

            <section>
                <h2>Meu Portfólio</h2>

                {!editing ? (
                    <>
                        <p>Itinerário: {portfolio.itinerario || 'Não informado'}</p>
                        <p>Turma: {portfolio.turma || 'Não informada'}</p>
                        <p>Apresentação: {portfolio.apresentacao || 'Não informada'}</p>
                        <p>Reflexão anual: {portfolio.reflexao_anual || 'Não informada'}</p>

                        <button onClick={() => {
                            setMessage('');
                            setEditing(true);
                        }}>
                            Editar informações
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleSave}>
                        <div>
                            <label htmlFor="itinerario">Itinerário</label>
                            <input
                                id="itinerario"
                                name="itinerario"
                                value={form.itinerario}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="turma">Turma</label>
                            <input
                                id="turma"
                                name="turma"
                                value={form.turma}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="apresentacao">Apresentação</label>
                            <textarea
                                id="apresentacao"
                                name="apresentacao"
                                value={form.apresentacao}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="reflexao_anual">Reflexão anual</label>
                            <textarea
                                id="reflexao_anual"
                                name="reflexao_anual"
                                value={form.reflexao_anual}
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setForm({
                                    itinerario: portfolio.itinerario || '',
                                    turma: portfolio.turma || '',
                                    apresentacao: portfolio.apresentacao || '',
                                    reflexao_anual: portfolio.reflexao_anual || ''
                                });
                                setEditing(false);
                                setError('');
                            }}
                        >
                            Cancelar
                        </button>
                    </form>
                )}
            </section>

            <section>
                <h2>Meus Projetos SENAI</h2>

                <form onSubmit={handleProjectSubmit}>
                    <h3>Novo projeto</h3>

                    <div>
                        <label htmlFor="titulo">Título</label>
                        <input
                            id="titulo"
                            name="titulo"
                            value={projectForm.titulo}
                            onChange={handleProjectChange}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="informacao">Informação</label>
                        <textarea
                            id="informacao"
                            name="informacao"
                            value={projectForm.informacao}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            name="descricao"
                            value={projectForm.descricao}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="relatorios_tecnicos">Relatórios técnicos</label>
                        <textarea
                            id="relatorios_tecnicos"
                            name="relatorios_tecnicos"
                            value={projectForm.relatorios_tecnicos}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="aprendizagens">Aprendizagens</label>
                        <textarea
                            id="aprendizagens"
                            name="aprendizagens"
                            value={projectForm.aprendizagens}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="competencias">Competências</label>
                        <textarea
                            id="competencias"
                            name="competencias"
                            value={projectForm.competencias}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="autoavaliacao">Autoavaliação</label>
                        <textarea
                            id="autoavaliacao"
                            name="autoavaliacao"
                            value={projectForm.autoavaliacao}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <button type="submit" disabled={creatingProject}>
                        {creatingProject ? 'Criando...' : 'Criar projeto'}
                    </button>
                </form>

                <h3>Projetos cadastrados</h3>

                {portfolio.projetosSENAI.map(project => (
                    <article key={project.id}>
                        {editingProjectId === project.id ? (
                            <form onSubmit={handleEditProjectSubmit}>
                                <h3>Editando projeto</h3>

                                <div>
                                    <label>Título</label>
                                    <input
                                        name="titulo"
                                        value={editingProjectForm.titulo}
                                        onChange={handleEditProjectChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Informação</label>
                                    <textarea
                                        name="informacao"
                                        value={editingProjectForm.informacao}
                                        onChange={handleEditProjectChange}
                                    />
                                </div>

                                <div>
                                    <label>Descrição</label>
                                    <textarea
                                        name="descricao"
                                        value={editingProjectForm.descricao}
                                        onChange={handleEditProjectChange}
                                    />
                                </div>

                                <div>
                                    <label>Relatórios técnicos</label>
                                    <textarea
                                        name="relatorios_tecnicos"
                                        value={editingProjectForm.relatorios_tecnicos}
                                        onChange={handleEditProjectChange}
                                    />
                                </div>

                                <div>
                                    <label>Aprendizagens</label>
                                    <textarea
                                        name="aprendizagens"
                                        value={editingProjectForm.aprendizagens}
                                        onChange={handleEditProjectChange}
                                    />
                                </div>

                                <div>
                                    <label>Competências</label>
                                    <textarea
                                        name="competencias"
                                        value={editingProjectForm.competencias}
                                        onChange={handleEditProjectChange}
                                    />
                                </div>

                                <div>
                                    <label>Autoavaliação</label>
                                    <textarea
                                        name="autoavaliacao"
                                        value={editingProjectForm.autoavaliacao}
                                        onChange={handleEditProjectChange}
                                    />
                                </div>

                                <button type="submit">
                                    Salvar alterações
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setEditingProjectId(null)}
                                >
                                    Cancelar
                                </button>
                            </form>
                        ) : (
                            <>
                                <h3>{project.titulo}</h3>

                                <p><strong>Informação:</strong> {project.informacao || 'Não informado'}</p>
                                <p><strong>Descrição:</strong> {project.descricao || 'Não informado'}</p>
                                <p><strong>Relatórios técnicos:</strong> {project.relatorios_tecnicos || 'Não informado'}</p>
                                <p><strong>Aprendizagens:</strong> {project.aprendizagens || 'Não informado'}</p>
                                <p><strong>Competências:</strong> {project.competencias || 'Não informado'}</p>
                                <p><strong>Autoavaliação:</strong> {project.autoavaliacao || 'Não informado'}</p>

                                <p>ID: {project.id}</p>

                                <button onClick={() => handleEditProject(project)}>
                                    Editar
                                </button>

                                <button onClick={() => handleDeleteProject(project.id)}>
                                    Excluir
                                </button>

                                <form onSubmit={event => handleAttachmentUpload(event, project.id)}>
                                    <h4>Adicionar anexo</h4>

                                    <input
                                        type="file"
                                        onChange={event => handleAttachmentChange(event, project.id)}
                                    />

                                    <button
                                        type="submit"
                                        disabled={
                                            uploadingAttachmentId === project.id ||
                                            !attachmentFiles[project.id]
                                        }
                                    >
                                        {uploadingAttachmentId === project.id
                                            ? 'Enviando...'
                                            : 'Enviar arquivo'}
                                    </button>

                                    {attachmentFeedback[project.id] && (
                                        <p>{attachmentFeedback[project.id]}</p>
                                    )}
                                </form>

                                {/* Display uploaded attachments */}
                                <div>
                                    <h4>Anexos</h4>

                                    {(projectAttachments[project.id] || []).length === 0 ? (
                                        <p>Nenhum anexo enviado.</p>
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
                            </>
                        )}
                    </article>
                ))}
            </section>
        </main>
    );
}

export default Dashboard;
