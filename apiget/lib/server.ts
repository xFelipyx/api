import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import cors from 'cors';
import emailjs from 'emailjs-com';  // Importando o emailjs

const app = express();
const port = 3000;

// Usando o middleware CORS
app.use(cors());
app.use(express.json());

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('/home/orcus/db/ohara.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Erro ao conectar com o banco de dados:', err.message);
  } else {
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  }
});

// Criar a tabela de declarações, caso não exista
db.run(`
  CREATE TABLE IF NOT EXISTS declaracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocolo TEXT UNIQUE,
    motivo TEXT,
    status TEXT
  )
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela de declarações:', err.message);
  }
});

// Interface de Aluno
interface Aluno {
  id: number;
  nome: string;
  data_nascimento: string;
  endereco: string;
  telefone: string;
  email: string;
  data_matricula: string;
  nome_responsavel: string;
  contato_responsavel: string;
  status_estudante: string;
  turmas: string;
  cod_etec: number;
  senha: string;
  rm: number;
}

// Função de login
function login(username: string, password: string, callback: (error: Error | null, user?: Aluno | null) => void): void {
  db.get("SELECT * FROM alunos WHERE rm = ?", [username], (error: Error | null, user: Aluno | undefined) => {
    if (error) {
      callback(error);
      return;
    }

    if (!user) {
      callback(null, null);
      return;
    }

    bcrypt.compare(password, user.senha, (err: Error | undefined, result: boolean) => {
      if (err) {
        callback(err);
        return;
      }

      if (result) {
        callback(null, user);
      } else {
        callback(null, null);
      }
    });
  });
}

// Rota de login
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  login(username, password, (error, user) => {
    if (error) {
      return res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
    }

    if (user) {
      // Aqui estamos armazenando os dados do aluno no backend (simplificado)
      res.status(200).json({ message: 'Login bem-sucedido!', user });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas!' });
    }
  });
});

// Função para enviar e-mail via EmailJS
function enviarEmailConfirmacao(motivo: string, protocolo: string, email: string) {
  const templateParams = {
    to_email: email,
    motivo: motivo,
    protocolo: protocolo,
  };

  // Configuração do envio de e-mail
  emailjs.send('service_0olh7hf', 'template_y4ax7dq', templateParams, 'N2GxcYN1TzFCSO92h')
    .then((response) => {
      console.log('E-mail enviado com sucesso', response);
    })
    .catch((err) => {
      console.error('Erro ao enviar o e-mail:', err);
    });
}

// Rota para solicitar a declaração
app.post('/solicitar-declaracao', (req: Request, res: Response) => {
  const { motivo, email } = req.body;
  const protocolo = 'PROTOCOLO-' + Math.floor(Math.random() * 1000000); // Gerando protocolo único
  const status = 'Em processamento'; // Status inicial

  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='declaracoes'", (err, table) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar tabela', error: err.message });
    }

    db.run("INSERT INTO declaracoes (protocolo, motivo, status) VALUES (?, ?, ?)", [protocolo, motivo, status], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao registrar declaração', error: err.message });
      }
      res.status(200).json({ message: 'Declaração solicitada com sucesso', protocolo });

      // Enviar e-mail após a solicitação de declaração
      enviarEmailConfirmacao(motivo, protocolo, email);
    });
  });
});

// Interface de Declaração
interface Declaracao {
  status: string;
}

// Rota para consultar a declaração pelo protocolo
app.get('/consultar-declaracao/:protocolo', (req: Request, res: Response) => {
  const { protocolo } = req.params;

  db.get("SELECT status FROM declaracoes WHERE protocolo = ?", [protocolo], (err, row: Declaracao) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao consultar declaração', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Declaração não encontrada' });
    }

    res.status(200).json({ status: row.status });
  });
});

// Rota para atualizar o status de uma declaração
app.put('/atualizar-status/:protocolo', (req: Request, res: Response) => {
  const { protocolo } = req.params;
  const { status } = req.body;

  db.run("UPDATE declaracoes SET status = ? WHERE protocolo = ?", [status, protocolo], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao atualizar status', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Declaração não encontrada' });
    }

    res.status(200).json({ message: 'Status atualizado com sucesso' });
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});


// Rota para buscar um aluno pelo ID
app.get('/aluno/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  db.get("SELECT * FROM alunos WHERE id = ?", [id], (err, row: Aluno) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar aluno', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }

    res.status(200).json(row);
  });
});
