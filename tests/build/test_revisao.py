"""A revisão de conteúdo feita por Mariângela Estelita Barros (novembro de 2026) está no site."""
import pathlib
import unittest

DIST = pathlib.Path(__file__).resolve().parents[2] / 'dist'


def read(name):
    return (DIST / name).read_text(encoding='utf-8')


class RevisaoEstelitaTest(unittest.TestCase):
    def assertRevised(self, page, new, old):
        text = read(page)
        self.assertIn(new, text)
        self.assertNotIn(old, text)

    def test_historia(self):
        self.assertRevised('historia.html', 'digitado em um teclado comum', 'digitado num teclado comum')
        self.assertRevised('historia.html', '<li><b>96</b>visografemas</li>', '<li><b>95</b>visografemas</li>')
        self.assertRevised('historia.html', '<li><b>45</b>movimento</li>', '<li><b>44</b>movimento</li>')
        self.assertRevised('historia.html', 'dedos, palma, ponto de articulação e movimento', 'dedos, palma, ponto e movimento')
        self.assertRevised('historia.html', 'No ano seguinte, entrou', 'No ano seguinte entrou')
        self.assertRevised('historia.html', 'Os contos Rapunzel, O príncipe sapo e vários outros podem ser lidos', 'de Rapunzel a O príncipe sapo')
        self.assertRevised('historia.html', 'levou onze anos para ser concluído.', 'levou onze anos.')
        self.assertRevised('historia.html', 'um guia online gratuito: neste site, qualquer pessoa', 'este site, onde qualquer pessoa')

    def test_guia(self):
        self.assertRevised('index.html', 'O sistema tem 96 visografemas básicos', 'O sistema tem 95 visografemas')
        self.assertRevised('index.html', 'A posição dos dedos.', 'Como os dedos se configuram.')
        self.assertRevised('index.html', 'Explore os 35 pontos de articulação da cabeça, tronco e membros.', 'Explore 28 referências')
        self.assertRevised('index.html', 'dois toques em diferentes áreas do mesmo ponto de articulação;', 'dois traços, dois toques;')
        self.assertRevised('index.html', 'A fonte escreve os sinais;', 'A fonte desenha os sinais;')

    def test_labio_superior(self):
        for script in ('app.js', 'anatomy.js'):
            with self.subTest(script=script):
                self.assertRevised(script, "T('Lábio superior')", "T('Buço')")


if __name__ == '__main__':
    unittest.main()
