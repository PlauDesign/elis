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
        self.assertRevised('historia.html', 'Por que a Libras, língua da comunidade surda brasileira, não tinha uma forma escrita que as pessoas de fato usassem?', 'Porque a Libras')
        self.assertRevised('historia.html', 'Ver as histórias contadas com as mãos desaparecerem quando as mãos param. Receber cada prova', 'Significa histórias contadas')
        self.assertRevised('historia.html', 'ela largou um emprego com bom salário em Goiânia', 'emprego rentável')
        self.assertRevised('historia.html', 'o público era pequeno demais para ter apelo comercial. Então, em 2021, sua filha,', 'diziam')
        self.assertRevised('historia.html', 'a Tutti Editora, dedicada a publicar os livros.', 'só para publicar')
        self.assertRevised('historia.html', 'Foi nesse momento que a fonte antiga não deu mais conta.', 'Aí a fonte antiga')
        self.assertRevised('historia.html', 'poderia passar das centenas de milhares de reais.', 'passar de cem mil reais')
        self.assertRevised('historia.html', '<span class="hl">me vi de mãos atadas.”</span>', 'vi-me')
        self.assertRevised('historia.html', 'não tenho como comissionar uma fonte”', 'não tenho como comprar uma fonte”')
        self.assertRevised('historia.html', 'A reunião aconteceu online em 5 de julho de 2024.', 'A reunião, online, foi')
        self.assertRevised('historia.html', 'A Plau topou o desafio na hora.', 'A Plau topou ali mesmo.')
        self.assertRevised('historia.html', 'não teria como comissionar o desenho de uma fonte. Foi então que ouviu que a Plau faria o trabalho <i>pro bono</i>.', 'não teria como comprar uma fonte')

    def test_links_unicode(self):
        for page in ('historia.html', 'historia-en.html', 'historia-es.html'):
            with self.subTest(page=page):
                text = read(page)
                self.assertIn('<a href="https://home.unicode.org/" target="_blank" rel="noopener">Unicode</a>', text)
                self.assertIn('<a href="https://www.unicode.org/charts/PDF/U1D800.pdf" target="_blank" rel="noopener">SignWriting</a>', text)

    def test_credito_projeto(self):
        self.assertRevised('historia.html', '<dt>Projeto</dt><dd>Plau</dd>', 'Pro bono da Plau')

    def test_engenharia_antes_de_design(self):
        text = read('historia.html')
        self.assertLess(text.index('<dt>Engenharia tipográfica</dt>'), text.index('<dt>Design</dt>'))

    def test_guia(self):
        # A revisão de Ana Laura Ferraz (novembro de 2026) reescreveu a introdução e os grupos; o conteúdo de Estelita continua.
        self.assertRevised('index.html', '96 visografemas básicos organizados em quatro grupos', 'O sistema tem 95 visografemas')
        self.assertNotIn('Como os dedos se configuram.', read('index.html'))
        self.assertRevised('index.html', 'Explore os 35 pontos de articulação da cabeça, tronco e membros.', 'Explore 28 referências')
        self.assertRevised('app.js', "T('Dois toques em diferentes áreas do mesmo ponto de articulação')", 'dois traços, dois toques;')
        self.assertRevised('index.html', 'A fonte escreve os sinais;', 'A fonte desenha os sinais;')

    def test_labio_superior(self):
        for script in ('app.js', 'anatomy.js'):
            with self.subTest(script=script):
                self.assertRevised(script, "T('Lábio superior')", "T('Buço')")


if __name__ == '__main__':
    unittest.main()
