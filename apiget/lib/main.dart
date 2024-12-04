import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Consulta de Aluno',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Consulta de Aluno'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  Map<String, dynamic>? aluno;
  bool isLoading = false;
  String errorMessage = '';

  // Função para buscar o aluno
  Future<void> fetchAluno() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      final response = await http.get(Uri.parse('http://192.168.10.181:3000/aluno/1'));

      if (response.statusCode == 200) {
        setState(() {
          aluno = json.decode(response.body);
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = 'Erro ao carregar dados: ${response.statusCode}';
          isLoading = false;
        });
      }
    } catch (error) {
      setState(() {
        errorMessage = 'Erro de conexão: $error';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : aluno != null
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Nome: ${aluno!['nome']}', style: const TextStyle(fontSize: 18)),
                      Text('Email: ${aluno!['email']}', style: const TextStyle(fontSize: 18)),
                      Text('Telefone: ${aluno!['telefone']}', style: const TextStyle(fontSize: 18)),
                      Text('Endereço: ${aluno!['endereco']}', style: const TextStyle(fontSize: 18)),
                      Text('Status: ${aluno!['status_estudante']}', style: const TextStyle(fontSize: 18)),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: fetchAluno,
                        child: const Text('Atualizar Dados'),
                      ),
                    ],
                  )
                : Center(
                    child: errorMessage.isNotEmpty
                        ? Text(errorMessage, style: const TextStyle(color: Colors.red))
                        : ElevatedButton(
                            onPressed: fetchAluno,
                            child: const Text('Buscar Aluno'),
                          ),
                  ),
      ),
    );
  }
}
