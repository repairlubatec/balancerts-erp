#!/usr/bin/env python3
"""
Improved PGC Parser - Parses Angolan Chart of Accounts comprehensively
"""

import json
import re
from typing import Dict, List, Optional
from collections import defaultdict

class Account:
    def __init__(self, code: str, name: str, description: str = ""):
        self.code = code
        self.name = name
        self.description = description
        self.children = []
    
    def to_dict(self):
        result = {
            "code": self.code,
            "name": self.name
        }
        if self.description:
            result["description"] = self.description
        if self.children:
            result["children"] = [child.to_dict() for child in sorted(self.children, key=lambda x: self.natural_sort_key(x.code))]
        return result
    
    @staticmethod
    def natural_sort_key(code: str):
        return [int(x) if x.isdigit() else x for x in code.split('.')]


def parse_pgc_complete():
    """Parse the PGC with comprehensive account extraction"""
    
    # Define complete class structure based on official PGC
    classes = {
        "1": {
            "name": "Meios fixos e investimentos",
            "description": "Fixed assets and investments",
            "accounts": {
                "11": ("Imobilizações corpóreas", "Tangible fixed assets"),
                "11.1": ("Terrenos e recursos naturais", ""),
                "11.1.1": ("Terrenos em bruto", ""),
                "11.1.2": ("Terrenos com arranjos", ""),
                "11.1.3": ("Subsolos", ""),
                "11.1.4": ("Terrenos com edifícios", ""),
                "11.1.4.1": ("Relativos a edifícios industriais", ""),
                "11.1.4.2": ("Relativos a edifícios administrativos e comerciais", ""),
                "11.1.4.3": ("Relativos a outros edifícios", ""),
                "11.2": ("Edifícios e outras construções", "Buildings and other structures"),
                "11.2.1": ("Edifícios", ""),
                "11.2.1.1": ("Integrados em conjuntos industriais", ""),
                "11.3": ("Equipamento básico", "Basic equipment"),
                "11.4": ("Equipamento de carga e transporte", "Loading and transport equipment"),
                "11.5": ("Equipamento administrativo", "Administrative equipment"),
                "11.6": ("Taras e vasilhame", "Containers and packaging"),
                "11.9": ("Outras imobilizações corpóreas", "Other tangible fixed assets"),
                "12": ("Imobilizações incorpóreas", "Intangible fixed assets"),
                "12.1": ("Trespasses", "Goodwill"),
                "12.2": ("Despesas de investigação e desenvolvimento", "Research and development expenses"),
                "12.3": ("Propriedade industrial e outros direitos e contratos", "Industrial property and other rights"),
                "12.4": ("Despesas de constituição", "Incorporation expenses"),
                "12.9": ("Outras imobilizações incorpóreas", "Other intangible assets"),
                "13": ("Investimentos Financeiros", "Financial investments"),
                "13.1": ("Empresas subsidiárias", "Subsidiary companies"),
                "13.1.1": ("Partes de capital", ""),
                "13.1.2": ("Obrigações e títulos de participação", ""),
                "13.1.3": ("Empréstimos", ""),
                "13.2": ("Empresas associadas", "Associated companies"),
                "13.2.1": ("Partes de capital", ""),
                "13.2.2": ("Obrigações e títulos de participação", ""),
                "13.2.3": ("Empréstimos", ""),
                "13.3": ("Outras empresas", "Other companies"),
                "13.3.1": ("Partes de capital", ""),
                "13.3.2": ("Obrigações e títulos de participação", ""),
                "13.3.3": ("Empréstimos", ""),
                "13.4": ("Investimentos em imóveis", "Real estate investments"),
                "13.5": ("Fundos", "Funds"),
                "13.9": ("Outros investimentos Financeiros", "Other financial investments"),
                "13.9.1": ("Diamantes", ""),
                "13.9.2": ("Ouro", ""),
                "13.9.3": ("Depósitos bancários", ""),
                "14": ("Imobilizações em Curso", "Work in progress"),
                "14.1": ("Obra em curso", ""),
                "14.2": ("Obra em curso", ""),
                "14.7": ("Adiantamentos por conta de imobilizado corpóreo", ""),
                "14.8": ("Adiantamentos por conta de imobilizado incorpóreo", ""),
                "14.9": ("Adiantamentos por conta de investimentos financeiros", ""),
                "18": ("Amortizações Acumuladas", "Accumulated depreciation"),
                "18.1": ("Imobilizações corpóreas", ""),
                "18.1.1": ("Terrenos e recursos naturais", ""),
                "18.1.2": ("Edifícios e outras construções", ""),
                "18.1.3": ("Equipamento básico", ""),
                "18.1.4": ("Equipamento de carga e transporte", ""),
                "18.1.5": ("Equipamento administrativo", ""),
                "18.1.6": ("Taras e vasilhame", ""),
                "18.1.9": ("Outras imobilizações corpóreas", ""),
                "18.2": ("Imobilizações incorpóreas", ""),
                "18.2.1": ("Trespasses", ""),
                "18.2.2": ("Despesas de investigação e desenvolvimento", ""),
                "18.2.3": ("Propriedade industrial e outros direitos e contratos", ""),
                "18.2.4": ("Despesas de constituição", ""),
                "18.2.9": ("Outras imobilizações incorpóreas", ""),
                "18.3": ("Investimentos financeiros em imóveis", ""),
                "18.3.1": ("Terrenos e recursos naturais", ""),
                "18.3.2": ("Edifícios e outras construções", ""),
                "19": ("Provisões para investimentos financeiros", "Provisions for financial investments"),
                "19.1": ("Empresas subsidiárias", ""),
                "19.1.1": ("Partes de capital", ""),
                "19.1.2": ("Obrigações e títulos de participação", ""),
                "19.1.3": ("Empréstimos", ""),
                "19.2": ("Empresas associadas", ""),
                "19.2.1": ("Partes de capital", ""),
                "19.2.2": ("Obrigações e títulos de participação", ""),
                "19.2.3": ("Empréstimos", ""),
                "19.3": ("Outras empresas", ""),
                "19.3.1": ("Partes de capital", ""),
                "19.3.2": ("Obrigações e títulos de participação", ""),
                "19.3.3": ("Empréstimos", ""),
                "19.4": ("Fundos", ""),
                "19.4.1": ("Partes de capital", ""),
                "19.9": ("Outros investimentos financeiros", ""),
                "19.9.1": ("Diamantes", ""),
                "19.9.2": ("Ouro", ""),
                "19.9.3": ("Depósitos bancários", ""),
            }
        },
        "2": {
            "name": "Existências",
            "description": "Inventories",
            "accounts": {
                "21": ("Compras", "Purchases"),
                "21.1": ("Matérias-primas, subsidiárias e de consumo", ""),
                "21.2": ("Mercadorias", ""),
                "21.7": ("Devoluções de compras", ""),
                "21.8": ("Descontos e abatimentos em compras", ""),
                "22": ("Matérias-primas, subsidiárias e de consumo", "Raw materials and consumables"),
                "22.1": ("Matérias-primas", ""),
                "22.2": ("Matérias subsidiárias", ""),
                "22.3": ("Materiais diversos", ""),
                "22.4": ("Embalagens de consumo", ""),
                "22.5": ("Outros materiais", ""),
                "23": ("Produtos e trabalhos em curso", "Work in progress"),
                "24": ("Produtos acabados e intermédios", "Finished and intermediate products"),
                "24.1": ("Produtos acabados", ""),
                "24.2": ("Produtos intermédios", ""),
                "24.9": ("Em poder de terceiros", ""),
                "25": ("Sub-produtos, desperdícios, resíduos e refugos", "By-products and waste"),
                "25.1": ("Sub-produtos", ""),
                "25.2": ("Desperdícios, resíduos e refugos", ""),
                "26": ("Mercadorias", "Goods"),
                "26.9": ("Em poder de terceiros", ""),
                "27": ("Matérias-primas, mercadorias e outros materiais em trânsito", "Materials in transit"),
                "27.1": ("Matérias-primas", ""),
                "27.2": ("Outros materiais", ""),
                "27.3": ("Mercadorias", ""),
                "28": ("Adiantamentos por conta de compras", "Purchase advances"),
                "28.1": ("Matérias-primas e outros materiais", ""),
                "28.2": ("Mercadorias", ""),
                "29": ("Provisão para depreciação de existências", "Provisions for inventory depreciation"),
                "29.2": ("Matérias-primas subsidiárias e de consumo", ""),
                "29.3": ("Produtos e trabalhos em curso", ""),
                "29.4": ("Produtos acabados e intermédios", ""),
                "29.5": ("Sub-produtos, desperdícios, resíduos e refugos", ""),
                "29.6": ("Mercadorias", ""),
            }
        },
        "3": {
            "name": "Terceiros",
            "description": "Third parties",
            "accounts": {
                "31": ("Clientes", "Customers"),
                "31.1": ("Clientes – correntes", ""),
                "31.1.1": ("Grupo", ""),
                "31.1.1.1": ("Subsidiárias", ""),
                "31.1.1.2": ("Associadas", ""),
                "31.1.2": ("Não grupo", ""),
                "31.1.2.1": ("Nacionais", ""),
                "31.1.2.2": ("Estrangeiros", ""),
                "31.2": ("Clientes – títulos a receber", ""),
                "31.2.1": ("Grupo", ""),
                "31.2.1.1": ("Subsidiárias", ""),
                "31.2.1.2": ("Associadas", ""),
                "31.2.2": ("Não grupo", ""),
                "31.2.2.1": ("Nacionais", ""),
                "31.2.2.2": ("Estrangeiros", ""),
                "31.3": ("Clientes – títulos descontados", ""),
                "31.3.1": ("Grupo", ""),
                "31.3.1.1": ("Subsidiárias", ""),
                "31.3.1.2": ("Associadas", ""),
                "31.3.2": ("Não grupo", ""),
                "31.3.2.1": ("Nacionais", ""),
                "31.3.2.2": ("Estrangeiros", ""),
                "31.8": ("Clientes de cobrança duvidosa", ""),
                "31.8.1": ("Clientes – correntes", ""),
                "31.8.2": ("Clientes – títulos", ""),
                "31.9": ("Clientes - saldos credores", ""),
                "31.9.1": ("Adiantamentos", ""),
                "31.9.2": ("Embalagens a devolver", ""),
                "31.9.3": ("Material à consignação", ""),
                "32": ("Fornecedores", "Suppliers"),
                "32.1": ("Fornecedores – correntes", ""),
                "32.1.1": ("Grupo", ""),
                "32.1.1.1": ("Subsidiárias", ""),
                "32.1.1.2": ("Associadas", ""),
                "32.1.2": ("Não grupo", ""),
                "32.1.2.1": ("Nacionais", ""),
                "32.1.2.2": ("Estrangeiros", ""),
                "32.2": ("Fornecedores – títulos a pagar", ""),
                "32.2.1": ("Grupo", ""),
                "32.2.1.1": ("Subsidiárias", ""),
                "32.2.1.2": ("Associadas", ""),
                "32.2.2": ("Não grupo", ""),
                "32.2.2.1": ("Nacionais", ""),
                "32.2.2.2": ("Estrangeiros", ""),
                "32.8": ("Fornecedores – facturas em recepção e conferência", ""),
                "32.9": ("Fornecedores – saldos devedores", ""),
                "32.9.1": ("Adiantamentos", ""),
                "32.9.2": ("Embalagens a devolver", ""),
                "32.9.3": ("Material à consignação", ""),
                "33": ("Empréstimos", "Loans"),
                "33.1": ("Empréstimos bancários", ""),
                "33.1.1": ("Moeda nacional", ""),
                "33.1.1.1": ("Banco ___", ""),
                "33.1.2": ("Moeda estrangeira", ""),
                "33.1.2.1": ("Banco ___", ""),
                "33.2": ("Empréstimos por obrigações", ""),
                "33.2.1": ("Convertíveis", ""),
                "33.2.1.1": ("Entidade ___", ""),
                "33.2.2": ("Não convertíveis", ""),
                "33.2.2.1": ("Entidade ___", ""),
                "33.3": ("Empréstimos por títulos de participação", ""),
                "33.3.1": ("Entidade ___", ""),
                "33.9": ("Outros empréstimos obtidos", ""),
                "33.9.1": ("Entidade ___", ""),
                "34": ("Estado", "Government"),
                "34.1": ("Imposto sobre os lucros", ""),
                "34.2": ("Imposto de produção e consumo", ""),
                "34.3": ("Imposto de rendimento de trabalho", ""),
                "34.4": ("Imposto de circulação", ""),
                "34.5": ("IVA", ""),
                "34.5.1": ("IVA suportado", ""),
                "34.5.1.1": ("Existências", ""),
                "34.5.1.2": ("Meios fixos e investimentos", ""),
                "34.5.1.3": ("Outros bens e serviços", ""),
                "34.5.2": ("IVA dedutível", ""),
                "34.5.2.1": ("Existências", ""),
                "34.5.2.2": ("Meios fixos e investimentos", ""),
                "34.5.2.3": ("Outros bens e serviços", ""),
                "34.5.3": ("IVA liquidado", ""),
                "34.5.3.1": ("Operações gerais", ""),
                "34.5.3.2": ("Operações abrangidas pelo regime de IVA de caixa", ""),
                "34.5.3.3": ("Autoconsumo e operações gratuitas", ""),
                "34.5.3.4": ("Operações especiais", ""),
                "34.5.4": ("IVA regularizações", ""),
                "34.5.4.1": ("Mensais a favor do sujeito passivo", ""),
                "34.5.4.2": ("Mensais a favor do Estado", ""),
                "34.5.4.3": ("Anual por cálculo do pró rata definitivo", ""),
                "34.5.4.4": ("Outras regularizações anuais", ""),
                "34.5.5": ("IVA apuramento", ""),
                "34.5.5.1": ("Apuramento do regime de IVA normal", ""),
                "34.5.5.2": ("Apuramento do regime de IVA de caixa", ""),
                "34.5.6": ("IVA a pagar", ""),
                "34.5.6.1": ("IVA a pagar de apuramento", ""),
                "34.5.6.2": ("IVA a pagar de cativo", ""),
                "34.5.6.3": ("IVA a pagar de liquidações oficiosas", ""),
                "34.5.7": ("IVA a recuperar", ""),
                "34.5.7.1": ("IVA a recuperar de apuramentos", ""),
                "34.5.7.2": ("IVA a recuperar de cativo", ""),
                "34.5.8": ("IVA reembolsos pedidos", ""),
                "34.5.8.1": ("Reembolsos pedidos", ""),
                "34.5.8.2": ("Reembolsos deferidos", ""),
                "34.5.8.3": ("Reembolsos indeferidos", ""),
                "34.5.8.4": ("Reembolsos reclamados, recorridos ou impugnados", ""),
                "34.5.9": ("IVA Liquidações oficiosas", ""),
                "34.6": ("Certificado de crédito fiscal a compensar", ""),
                "34.8": ("Subsídios a preços", ""),
                "34.9": ("Outros impostos", ""),
                "35": ("Entidades participantes e participadas", "Participating entities"),
                "35.1": ("Entidades participantes", ""),
                "35.1.1": ("Estado", ""),
                "35.1.1.1": ("c/subscrição", ""),
                "35.1.1.2": ("c/adiantamentos sobre lucros", ""),
                "35.1.1.3": ("c/lucros", ""),
                "35.1.1.4": ("Empréstimos", ""),
                "35.1.2": ("Empresas do grupo – subsidiárias", ""),
                "35.1.2.1": ("c/subscrição", ""),
                "35.1.2.2": ("c/adiantamentos sobre lucros", ""),
                "35.1.2.3": ("c/lucros", ""),
                "35.1.2.4": ("Empréstimos", ""),
                "35.1.3": ("Empresas do grupo – associadas", ""),
                "35.1.3.1": ("c/subscrição", ""),
                "35.1.3.2": ("c/adiantamentos sobre lucros", ""),
                "35.1.3.3": ("c/lucros", ""),
                "35.1.3.4": ("Empréstimos", ""),
                "35.1.4": ("Outros", ""),
                "35.1.4.1": ("c/subscrição", ""),
                "35.1.4.2": ("c/adiantamentos sobre lucros", ""),
                "35.1.4.3": ("c/lucros", ""),
                "35.1.4.4": ("Empréstimos", ""),
                "35.2": ("Entidades participadas", ""),
                "35.2.1": ("Estado", ""),
                "35.2.1.1": ("c/subscrição", ""),
                "35.2.1.2": ("c/adiantamentos sobre lucros", ""),
                "35.2.1.3": ("c/lucros", ""),
                "35.2.1.4": ("Empréstimos", ""),
                "35.2.2": ("Empresas do grupo – subsidiárias", ""),
                "35.2.2.1": ("c/subscrição", ""),
                "35.2.2.2": ("c/adiantamentos sobre lucros", ""),
                "35.2.2.3": ("c/lucros", ""),
                "35.2.2.4": ("Empréstimos", ""),
                "35.2.3": ("Empresas do grupo – associadas", ""),
                "35.2.3.1": ("c/subscrição", ""),
                "35.2.3.2": ("c/adiantamentos sobre lucros", ""),
                "35.2.3.3": ("c/lucros", ""),
                "35.2.3.4": ("Empréstimos", ""),
                "35.2.4": ("Outros", ""),
                "35.2.4.1": ("c/subscrição", ""),
                "35.2.4.2": ("c/adiantamentos sobre lucros", ""),
                "35.2.4.3": ("c/lucros", ""),
                "35.2.4.4": ("Empréstimos", ""),
                "36": ("Pessoal", "Personnel"),
                "36.1": ("Pessoal – remunerações", ""),
                "36.1.1": ("Órgãos sociais", ""),
                "36.1.2": ("Empregados", ""),
                "36.2": ("Pessoal – participação nos resultados", ""),
                "36.2.1": ("Órgãos sociais", ""),
                "36.2.2": ("Empregados", ""),
                "36.3": ("Pessoal – adiantamentos", ""),
                "36.9": ("Pessoal – outros", ""),
                "37": ("Outros valores a receber e a pagar", "Other receivables and payables"),
                "37.1": ("Compras de imobilizado", ""),
                "37.1.1": ("Corpóreo", ""),
                "37.1.2": ("Incorpóreo", ""),
                "37.1.3": ("Financeiro", ""),
                "37.2": ("Vendas de imobilizado", ""),
                "37.2.1": ("Corpóreo", ""),
                "37.2.2": ("Incorpóreo", ""),
                "37.2.3": ("Financeiro", ""),
                "37.3": ("Proveitos a facturar", ""),
                "37.3.1": ("Vendas", ""),
                "37.3.2": ("Prestações de serviço", ""),
                "37.3.3": ("Juros", ""),
                "37.4": ("Encargos a repartir por períodos futuros", ""),
                "37.4.1": ("Descontos de emissão de obrigações", ""),
                "37.4.2": ("Descontos de emissão de títulos de participação", ""),
                "37.5": ("Encargos a pagar", ""),
                "37.5.1": ("Remunerações", ""),
                "37.5.2": ("Juros", ""),
                "37.6": ("Proveitos a repartir por períodos futuros", ""),
                "37.6.1": ("Prémios de emissão de obrigações", ""),
                "37.6.2": ("Prémios de emissão de títulos de participação", ""),
                "37.6.3": ("Subsídios para investimento", ""),
                "37.6.4": ("Diferenças de câmbio favoráveis reversíveis", ""),
                "37.7": ("Contas transitórias", ""),
                "37.7.1": ("Transacções entre a sede e as dependências da empresa", ""),
                "37.9": ("Outros valores a receber e a pagar", ""),
                "38": ("Provisões para cobranças duvidosas", "Provisions for doubtful debts"),
                "38.1": ("Provisões para clientes", ""),
                "38.1.1": ("Clientes – correntes", ""),
                "38.1.1.1": ("Grupo", ""),
                "38.1.1.2": ("Não grupo", ""),
                "38.1.2": ("Cliente – títulos a receber", ""),
                "38.1.2.1": ("Grupo", ""),
                "38.1.2.2": ("Não grupo", ""),
                "38.1.3": ("Clientes – cobrança duvidosa", ""),
                "38.1.3.1": ("Grupo", ""),
                "38.1.3.2": ("Não grupo", ""),
                "38.2": ("Provisões para saldos devedores de fornecedores", ""),
                "38.3": ("Provisões p/participantes e participadas", ""),
                "38.3.1": ("Participantes", ""),
                "38.3.2": ("Participadas", ""),
                "38.4": ("Provisões p/dívidas do pessoal", ""),
                "38.9": ("Provisões para outros saldos a receber", ""),
                "38.9.1": ("Vendas imobilizado", ""),
                "39": ("Provisões para outros riscos e encargos", "Provisions for other risks and charges"),
                "39.1": ("Provisões para pensões", ""),
                "39.2": ("Provisões para processos judiciais em curso", ""),
                "39.3": ("Provisões para acidentes de trabalho", ""),
                "39.4": ("Provisões para garantias dadas a clientes", ""),
                "39.9": ("Provisões para outros riscos e encargos", ""),
            }
        },
        "4": {
            "name": "Meios monetários",
            "description": "Monetary assets",
            "accounts": {
                "41": ("Títulos negociáveis", "Marketable securities"),
                "41.1": ("Acções", ""),
                "41.1.1": ("Empresas do grupo", ""),
                "41.1.2": ("Associadas", ""),
                "41.1.3": ("Outras empresas", ""),
                "41.2": ("Obrigações", ""),
                "41.2.1": ("Empresas do grupo", ""),
                "41.2.2": ("Associadas", ""),
                "41.2.3": ("Outras empresas", ""),
                "41.3": ("Títulos da dívida pública", ""),
                "42": ("Depósitos a prazo", "Time deposits"),
                "42.1": ("Moeda nacional", ""),
                "42.1.1": ("Banco ___", ""),
                "42.1.2": ("Banco ___", ""),
                "42.2": ("Moeda estrangeira", ""),
                "42.2.1": ("Banco ___", ""),
                "42.2.2": ("Banco ___", ""),
                "43": ("Depósitos à ordem", "Demand deposits"),
                "43.1": ("Moeda nacional", ""),
                "43.1.1": ("Banco ___", ""),
                "43.1.2": ("Banco ___", ""),
                "43.2": ("Moeda estrangeira", ""),
                "43.2.1": ("Banco ___", ""),
                "43.2.2": ("Banco ___", ""),
                "44": ("Outros depósitos", "Other deposits"),
                "44.1": ("Moeda nacional", ""),
                "44.1.1": ("Banco ___", ""),
                "44.1.2": ("Banco ___", ""),
                "44.2": ("Moeda estrangeira", ""),
                "44.2.1": ("Banco ___", ""),
                "44.2.2": ("Banco ___", ""),
                "45": ("Caixa", "Cash"),
                "45.1": ("Fundo fixo", ""),
                "45.1.1": ("Caixa ___", ""),
                "45.1.2": ("Caixa ___", ""),
                "45.2": ("Valores para depositar", ""),
                "45.3": ("Valores destinados a pagamentos específicos", ""),
                "45.3.1": ("Salários", ""),
                "48": ("Conta transitória", "Transit account"),
                "48.1": ("Banco ___", ""),
                "48.2": ("Banco ___", ""),
                "49": ("Provisões para aplicações de tesouraria", "Provisions for treasury investments"),
                "49.1": ("Títulos negociáveis", ""),
                "49.1.1": ("Acções", ""),
                "49.1.2": ("Obrigações", ""),
                "49.1.3": ("Títulos da dívida pública", ""),
                "49.2": ("Outras aplicações de tesouraria", ""),
            }
        },
        "5": {
            "name": "Capital e reservas",
            "description": "Equity",
            "accounts": {
                "51": ("Capital", "Capital"),
                "52": ("Acções/quotas próprias", "Own shares/quotas"),
                "52.1": ("Valor nominal", ""),
                "52.2": ("Descontos", ""),
                "52.3": ("Prémios", ""),
                "53": ("Prémios de emissão", "Share premium"),
                "54": ("Prestações suplementares", "Supplementary contributions"),
                "55": ("Reservas legais", "Legal reserves"),
                "56": ("Reservas de reavaliação", "Revaluation reserves"),
                "56.1": ("Legais", ""),
                "56.1.1": ("Decreto-Lei n.º ___", ""),
                "56.1.2": ("Decreto-Lei n.º ___", ""),
                "56.2": ("Autónomas", ""),
                "56.2.1": ("Avaliação", ""),
                "56.2.2": ("Realização", ""),
                "57": ("Reservas com fins especiais", "Special purpose reserves"),
                "58": ("Reservas livres", "Free reserves"),
            }
        },
        "6": {
            "name": "Proveitos e ganhos por natureza",
            "description": "Income and gains by nature",
            "accounts": {
                "61": ("Vendas", "Sales"),
                "61.1": ("Produtos acabados e intermédios", ""),
                "61.1.1": ("Mercado nacional", ""),
                "61.1.2": ("Mercado estrangeiro", ""),
                "61.2": ("Sub-produtos, desperdícios, resíduos e refugos", ""),
                "61.2.1": ("Mercado nacional", ""),
                "61.2.2": ("Mercado estrangeiro", ""),
                "61.3": ("Mercadorias", ""),
                "61.3.1": ("Mercado nacional", ""),
                "61.3.2": ("Mercado estrangeiro", ""),
                "61.4": ("Embalagens de consumo", ""),
                "61.4.1": ("Mercado nacional", ""),
                "61.4.2": ("Mercado estrangeiro", ""),
                "61.5": ("Subsídios a preços", ""),
                "61.7": ("Devoluções", ""),
                "61.7.1": ("Mercado nacional", ""),
                "61.7.2": ("Mercado estrangeiro", ""),
                "61.8": ("Descontos e abatimentos", ""),
                "61.8.1": ("Mercado nacional", ""),
                "61.8.2": ("Mercado estrangeiro", ""),
                "61.9": ("Transferência para resultados operacionais", ""),
                "62": ("Prestações de serviço", "Services"),
                "62.1": ("Serviços principais", ""),
                "62.1.1": ("Mercado nacional", ""),
                "62.1.2": ("Mercado estrangeiro", ""),
                "62.2": ("Serviços secundários", ""),
                "62.2.1": ("Mercado nacional", ""),
                "62.2.2": ("Mercado estrangeiro", ""),
                "62.8": ("Descontos e abatimentos", ""),
                "62.8.1": ("Mercado nacional", ""),
                "62.8.2": ("Mercado estrangeiro", ""),
                "62.9": ("Transferência para resultados operacionais", ""),
                "63": ("Outros proveitos operacionais", "Other operating income"),
                "63.1": ("Serviços suplementares", ""),
                "63.1.1": ("Aluguer de equipamento", ""),
                "63.1.2": ("Cedência de pessoal", ""),
                "63.1.3": ("Cedência de energia", ""),
                "63.1.4": ("Estudos, projectos e assistência técnica", ""),
                "63.2": ("Royalties", ""),
                "63.3": ("Subsídios à exploração", ""),
                "63.4": ("Subsídios a investimento", ""),
                "63.5": ("IVA", ""),
                "63.8": ("Outros proveitos e ganhos operacionais", ""),
                "63.9": ("Transferência para resultados operacionais", ""),
                "64": ("Variação nos inventários de produtos acabados e de produção em curso", "Change in finished goods and work in progress"),
                "64.1": ("Produtos e trabalhos em curso", ""),
                "64.2": ("Produtos acabados", ""),
                "64.3": ("Produtos intermédios", ""),
                "64.9": ("Transferência para resultados operacionais", ""),
                "65": ("Trabalhos para a própria empresa", "Work for own entity"),
                "65.1": ("Para imobilizado", ""),
                "65.1.1": ("Corpóreo", ""),
                "65.1.2": ("Incorpóreo", ""),
                "65.1.3": ("Financeiro", ""),
                "65.1.4": ("Em curso", ""),
                "65.2": ("Para encargos a repartir por exercícios futuros", ""),
                "65.9": ("Transferência para resultados operacionais", ""),
                "66": ("Proveitos e ganhos financeiros gerais", "General financial income and gains"),
                "66.1": ("Juros", ""),
                "66.1.1": ("De investimentos financeiros", ""),
                "66.1.1.1": ("Obrigações", ""),
                "66.1.1.3": ("Títulos de participação", ""),
                "66.1.1.4": ("Empréstimos", ""),
                "66.1.1.9": ("Outros", ""),
                "66.1.2": ("De mora relativos a dívidas de terceiros", ""),
                "66.1.2.1": ("Dívidas recebidas a prestações", ""),
                "66.1.2.2": ("De empréstimos a terceiros", ""),
                "66.1.4": ("Desconto de títulos", ""),
                "66.1.5": ("De aplicações de tesouraria", ""),
                "66.2": ("Diferenças de câmbio favoráveis", ""),
                "66.2.1": ("Realizadas", ""),
                "66.2.2": ("Não realizadas", ""),
                "66.3": ("Descontos de pronto pagamento obtidos", ""),
                "66.4": ("Rendimentos de investimentos em imóveis", ""),
                "66.5": ("Rendimento de participações de capital", ""),
                "66.5.1": ("Acções, quotas em outras empresas", ""),
                "66.5.2": ("Acções, quotas incluídas nos fundos", ""),
                "66.5.3": ("Acções, quotas incluídas nos títulos negociáveis", ""),
                "66.6": ("Ganhos na alienação de aplicações financeiras", ""),
                "66.6.1": ("Investimentos financeiros", ""),
                "66.6.1.1": ("Subsidiárias", ""),
                "66.6.1.2": ("Associadas", ""),
                "66.6.1.3": ("Outras empresas", ""),
                "66.6.1.4": ("Imóveis", ""),
                "66.6.1.5": ("Fundos", ""),
                "66.6.1.9": ("Outros investimentos", ""),
                "66.6.2": ("Títulos negociáveis", ""),
                "66.7": ("Reposição de provisões", ""),
                "66.7.1": ("Investimentos financeiros", ""),
                "66.7.1.1": ("Subsidiárias", ""),
                "66.7.1.2": ("Associadas", ""),
                "66.7.1.3": ("Outras empresas", ""),
                "66.7.1.4": ("Fundos", ""),
                "66.7.1.9": ("Outros investimentos", ""),
                "66.7.2": ("Aplicações de tesouraria", ""),
                "66.7.2.1": ("Títulos negociáveis", ""),
                "66.7.2.2": ("Depósitos a prazo", ""),
                "66.7.2.3": ("Outros depósitos", ""),
                "66.7.2.9": ("Outros investimentos", ""),
                "66.9": ("Transferência para resultados financeiros", ""),
                "67": ("Proveitos e ganhos financeiros em filiais e associadas", "Financial income from subsidiaries and associates"),
                "67.1": ("Rendimento de participações de capital", ""),
                "67.1.1": ("Subsidiárias", ""),
                "67.1.2": ("Associadas", ""),
                "67.9": ("Transferência para resultados em filiais e associadas", ""),
                "68": ("Outros proveitos e ganhos não operacionais", "Other non-operating income"),
                "68.1": ("Reposição de provisões", ""),
                "68.1.1": ("Existências", ""),
                "68.1.1.1": ("Matérias-primas subsidiárias e de consumo", ""),
                "68.1.1.2": ("Produtos e trabalhos em curso", ""),
                "68.1.1.3": ("Produtos acabados e intermédios", ""),
                "68.1.1.4": ("Sub-produtos, desperdícios, resíduos e refugos", ""),
                "68.1.1.5": ("Mercadorias", ""),
                "68.1.2": ("Cobranças duvidosas", ""),
                "68.1.2.1": ("Clientes", ""),
                "68.1.2.2": ("Clientes – títulos a receber", ""),
                "68.1.2.3": ("Clientes – cobrança duvidosa", ""),
                "68.1.2.4": ("Saldos devedores de fornecedores", ""),
                "68.1.2.5": ("Participantes e participadas", ""),
                "68.1.2.6": ("Dívidas do Pessoal", ""),
                "68.1.2.9": ("Outros saldos a receber", ""),
                "68.1.3": ("Riscos e encargos", ""),
                "68.1.3.1": ("Pensões", ""),
                "68.1.3.2": ("Processos judiciais em curso", ""),
                "68.1.3.3": ("Acidentes de trabalho", ""),
                "68.1.3.4": ("Garantias dadas a clientes", ""),
                "68.1.3.9": ("Outros riscos e encargos", ""),
                "68.2": ("Anulação de amortizações extraordinárias", ""),
                "68.2.1": ("Imobilizações corpóreas", ""),
                "68.2.2": ("Imobilizações incorpóreas", ""),
                "68.3": ("Ganhos em imobilizações", ""),
                "68.3.1": ("Venda de imobilizações corpóreas", ""),
                "68.3.2": ("Venda de imobilizações incorpóreas", ""),
                "68.4": ("Ganhos em existências", ""),
                "68.4.1": ("Sobras", ""),
                "68.5": ("Recuperação de dívidas", ""),
                "68.6": ("Benefícios de penalidades contratuais", ""),
                "68.8": ("Descontinuidade de operações", ""),
                "68.9": ("Alterações de políticas contabilísticas", ""),
                "68.10": ("Correcções relativas a exercícios anteriores", ""),
                "68.10.1": ("Estimativa impostos", ""),
                "68.10.2": ("Restituição de impostos", ""),
                "68.11": ("Outros ganhos e perdas não operacionais", ""),
                "68.11.1": ("Donativos", ""),
                "68.19": ("Transferência para resultados não operacionais", ""),
                "69": ("Proveitos e ganhos extraordinários", "Extraordinary income and gains"),
                "69.1": ("Ganhos resultantes de catástrofes naturais", ""),
                "69.2": ("Ganhos resultantes de convulsões políticas", ""),
                "69.3": ("Ganhos resultantes de expropriações", ""),
                "69.4": ("Ganhos resultantes de sinistros", ""),
                "69.5": ("Subsídios", ""),
                "69.6": ("Anulação de passivos não exigíveis", ""),
                "69.9": ("Transferência para resultados extraordinários", ""),
            }
        },
        "7": {
            "name": "Custos e perdas por natureza",
            "description": "Costs and losses by nature",
            "accounts": {
                "71": ("Custo das existências vendidas", "Cost of goods sold"),
                "71.1": ("Matérias-primas", ""),
                "71.2": ("Matérias subsidiárias", ""),
                "71.3": ("Materiais diversos", ""),
                "71.4": ("Embalagens de consumo", ""),
                "71.5": ("Outros materiais", ""),
                "71.9": ("Transferência para resultados operacionais", ""),
                "72": ("Custos com o pessoal", "Personnel costs"),
                "72.1": ("Remunerações – Órgãos sociais", ""),
                "72.2": ("Remunerações – Pessoal", ""),
                "72.3": ("Pensões", ""),
                "72.3.1": ("Órgãos sociais", ""),
                "72.3.2": ("Pessoal", ""),
                "72.4": ("Prémios para pensões", ""),
                "72.4.1": ("Órgãos sociais", ""),
                "72.4.2": ("Pessoal", ""),
                "72.5": ("Encargos sobre remunerações", ""),
                "72.5.1": ("Órgãos sociais", ""),
                "72.5.2": ("Pessoal", ""),
                "72.6": ("Seguros de acidentes de trabalho e doenças profissionais", ""),
                "72.6.1": ("Órgãos sociais", ""),
                "72.6.2": ("Pessoal", ""),
                "72.7": ("Formação", ""),
                "72.7.1": ("Órgãos sociais", ""),
                "72.7.2": ("Pessoal", ""),
                "72.8": ("Outras despesas com o pessoal", ""),
                "72.8.1": ("Órgãos sociais", ""),
                "72.8.2": ("Pessoal", ""),
                "72.9": ("Transferência para resultados operacionais", ""),
                "73": ("Amortizações do exercício", "Depreciation for the period"),
                "73.1": ("Imobilizações corpóreas", ""),
                "73.1.2": ("Edifícios e outras construções", ""),
                "73.1.3": ("Equipamento básico", ""),
                "73.1.4": ("Equipamento de carga e transporte", ""),
                "73.1.5": ("Equipamento administrativo", ""),
                "73.1.6": ("Taras e vasilhame", ""),
                "73.1.9": ("Outras imobilizações corpóreas", ""),
                "73.2": ("Imobilizações incorpóreas", ""),
                "73.2.1": ("Trespasses", ""),
                "73.2.2": ("Despesas de investigação e desenvolvimento", ""),
                "73.2.3": ("Propriedade industrial e outros direitos e contratos", ""),
                "73.2.4": ("Despesas de constituição", ""),
                "73.2.9": ("Outras imobilizações incorpóreas", ""),
                "73.9": ("Transferência para resultados operacionais", ""),
                "75": ("Outros custos e perdas operacionais", "Other operating costs and losses"),
                "75.1": ("Sub-contratos", ""),
                "75.2": ("Fornecimentos e serviços de terceiros", ""),
                "75.2.11": ("Água", ""),
                "75.2.12": ("Electricidade", ""),
                "75.2.13": ("Combustíveis e outros fluídos", ""),
                "75.2.14": ("Conservação e reparação", ""),
                "75.2.15": ("Material de protecção segurança e conforto", ""),
                "75.2.16": ("Ferramentas e utensílios de desgaste rápido", ""),
                "75.2.17": ("Material de escritório", ""),
                "75.2.18": ("Livros e documentação técnica", ""),
                "75.2.19": ("Outros fornecimentos", ""),
                "75.2.20": ("Comunicação", ""),
                "75.2.21": ("Rendas e alugueres", ""),
                "75.2.22": ("Seguros", ""),
                "75.2.23": ("Deslocações e estadas", ""),
                "75.2.24": ("Despesas de representação", ""),
                "75.2.26": ("Conservação e reparação", ""),
                "75.2.27": ("Vigilância e segurança", ""),
                "75.2.28": ("Limpeza, higiene e conforto", ""),
                "75.2.29": ("Publicidade e propaganda", ""),
                "75.2.30": ("Contencioso e notariado", ""),
                "75.2.31": ("Comissões a intermediários", ""),
                "75.2.32": ("Assistência técnica", ""),
                "75.2.32.1": ("Estrangeira", ""),
                "75.2.32.2": ("Nacional", ""),
                "75.2.33": ("Trabalhos executados no exterior", ""),
                "75.2.34": ("Honorários e avenças", ""),
                "75.2.35": ("Royalties", ""),
                "75.2.39": ("Outros serviços", ""),
                "75.3": ("Impostos", ""),
                "75.3.1": ("Indirectos", ""),
                "75.3.1.1": ("Imposto de selo", ""),
                "75.3.1.2": ("IVA", ""),
                "75.3.1.9": ("Outros impostos", ""),
                "75.3.2": ("Directos", ""),
                "75.3.2.1": ("Imposto de capitais", ""),
                "75.3.2.2": ("Contribuição predial", ""),
                "75.3.2.9": ("Outros impostos", ""),
                "75.4": ("Despesas confidênciais", ""),
                "75.5": ("Quotizações", ""),
                "75.6": ("Ofertas e Amostras de existências", ""),
                "75.8": ("Outros custos e perdas operacionais", ""),
                "75.9": ("Transferências para resultados operacionais", ""),
                "76": ("Custos e perdas financeiros gerais", "General financial costs and losses"),
                "76.1": ("Juros", ""),
                "76.1.1": ("De empréstimos", ""),
                "76.1.1.1": ("Bancários", ""),
                "76.1.1.2": ("Obrigações", ""),
                "76.1.1.3": ("Títulos de participação", ""),
                "76.1.2": ("De descobertos bancários", ""),
                "76.1.3": ("De mora relativos a dívidas a terceiros", ""),
                "76.1.4": ("De desconto de títulos", ""),
                "76.2": ("Diferenças de câmbio desfavoráveis", ""),
                "76.2.1": ("Realizadas", ""),
                "76.2.2": ("Não realizadas", ""),
                "76.3": ("Descontos de pronto pagamento concedidos", ""),
                "76.4": ("Amortizações de investimentos em imóveis", ""),
                "76.5": ("Provisões para aplicações financeiras", ""),
                "76.5.1": ("Investimentos financeiros", ""),
                "76.5.1.1": ("Subsidiárias", ""),
                "76.5.1.2": ("Associadas", ""),
                "76.5.1.3": ("Outras empresas", ""),
                "76.5.1.4": ("Fundos", ""),
                "76.5.1.9": ("Outros investimentos", ""),
                "76.5.2": ("Aplicações de tesouraria", ""),
                "76.5.2.1": ("Títulos negociáveis", ""),
                "76.5.2.2": ("Depósitos a prazo", ""),
                "76.5.2.3": ("Outros depósitos", ""),
                "76.5.2.9": ("Outros", ""),
                "76.6": ("Perdas na alienação de aplicações financeiras", ""),
                "76.6.1": ("Investimentos financeiros", ""),
                "76.6.1.1": ("Subsidiárias", ""),
                "76.6.1.2": ("Associadas", ""),
                "76.6.1.3": ("Outras empresas", ""),
                "76.6.1.4": ("Fundos", ""),
                "76.6.1.9": ("Outros investimentos", ""),
                "76.6.2": ("Aplicações de títulos negociáveis", ""),
                "76.7": ("Serviços bancários", ""),
                "76.9": ("Transferência para resultados financeiros", ""),
                "77": ("Custos e perdas financeiros em filiais e associadas", "Financial costs in subsidiaries and associates"),
                "77.9": ("Transferência para resultados financeiros", ""),
                "78": ("Outros custos e perdas não operacionais", "Other non-operating costs and losses"),
                "78.1": ("Provisões do exercício", ""),
                "78.1.1": ("Existências", ""),
                "78.1.1.1": ("Matérias-primas subsidiárias e de consumo", ""),
                "78.1.1.2": ("Produtos e trabalhos em curso", ""),
                "78.1.1.3": ("Produtos acabados e intermédios", ""),
                "78.1.1.4": ("Sub-produtos, desperdícios, resíduos e refugos", ""),
                "78.1.1.5": ("Mercadorias", ""),
                "78.1.2": ("Cobranças Duvidosas", ""),
                "78.1.2.1": ("Clientes", ""),
                "78.1.2.2": ("Clientes – títulos a receber", ""),
                "78.1.2.3": ("Clientes – cobrança duvidosa", ""),
                "78.1.2.4": ("Saldos devedores de fornecedores", ""),
                "78.1.2.5": ("Participantes e participadas", ""),
                "78.1.2.6": ("Dívidas do pessoal", ""),
                "78.1.2.9": ("Outros saldos a receber", ""),
                "78.1.3": ("Riscos e encargos", ""),
                "78.1.3.1": ("Pensões", ""),
                "78.1.3.2": ("Processos judiciais em curso", ""),
                "78.1.3.3": ("Acidentes de trabalho", ""),
                "78.1.3.4": ("Garantias dadas a clientes", ""),
                "78.1.3.9": ("Outros riscos e encargos", ""),
                "78.2": ("Amortizações extraordinárias", ""),
                "78.2.1": ("Imobilizações Corpóreas", ""),
                "78.2.2": ("Imobilizações Incorpóreas", ""),
                "78.3": ("Perdas em imobilizações", ""),
                "78.3.1": ("Venda de imobilizações corpóreas", ""),
                "78.3.2": ("Venda de imobilizações incorpóreas", ""),
                "78.3.3": ("Abates", ""),
                "78.3.9": ("Outras", ""),
                "78.4": ("Perdas em existências", ""),
                "78.4.1": ("Quebras", ""),
                "78.5": ("Dívidas incobráveis", ""),
                "78.6": ("Multas e penalidades contratuais", ""),
                "78.6.1": ("Fiscais", ""),
                "78.6.2": ("Não fiscais", ""),
                "78.6.3": ("Penalidades contratuais", ""),
                "78.7": ("Custos de reestruturação", ""),
                "78.8": ("Descontinuidade de operações", ""),
                "78.9": ("Alterações de políticas contabilísticas", ""),
                "78.10": ("Correcções relativas a exercícios anteriores", ""),
                "78.10.1": ("Estimativa impostos", ""),
                "78.11": ("Outros custos e perdas não operacionais", ""),
                "78.11.1": ("Donativos", ""),
                "78.11.2": ("Reembolso de subsídios à exploração", ""),
                "78.11.3": ("Reembolso de subsídios a investimentos", ""),
                "78.19": ("Transferência para resultados não operacionais", ""),
                "79": ("Custos e perdas extraordinárias", "Extraordinary costs and losses"),
                "79.1": ("Perdas resultantes de catástrofes naturais", ""),
                "79.2": ("Perdas resultantes de convulsões políticas", ""),
                "79.3": ("Perdas resultantes de expropriações", ""),
                "79.4": ("Perdas resultantes de sinistros", ""),
                "79.9": ("Transferência para resultados extraordinários", ""),
            }
        },
        "8": {
            "name": "Resultados",
            "description": "Results",
            "accounts": {
                "81": ("Resultados transitados", "Retained earnings"),
                "81.1": ("Ano____", ""),
                "81.1.1": ("Resultado do ano", ""),
                "81.1.2": ("Aplicação de resultados", ""),
                "81.1.3": ("Correcções de erros fundamentais, no exercício seguinte", ""),
                "81.1.4": ("Efeito das alterações de políticas contabilísticas", ""),
                "81.1.5": ("Imposto relativo a correcções de erros fundamentais e alterações de políticas contabilísticas", ""),
                "81.2": ("Ano____", ""),
                "81.2.1": ("Resultado do ano", ""),
                "81.2.2": ("Aplicação de resultados", ""),
                "81.2.3": ("Correcções de erros fundamentais, no exercício seguinte", ""),
                "81.2.4": ("Efeito das alterações de políticas contabilísticas", ""),
                "81.2.5": ("Imposto relativo a correcções de erros fundamentais e alterações de políticas contabilísticas", ""),
                "82": ("Resultados operacionais", "Operating results"),
                "82.1": ("Vendas", ""),
                "82.2": ("Prestações de serviço", ""),
                "82.3": ("Outros proveitos operacionais", ""),
                "82.4": ("Variação nos inventários de produtos acabados e produtos em vias de fabrico", ""),
                "82.5": ("Trabalhos para a própria empresa", ""),
                "82.6": ("Custo das mercadorias vendidas e das matérias consumidas", ""),
                "82.7": ("Custos com o pessoal", ""),
                "82.8": ("Amortizações do exercício", ""),
                "82.9": ("Outros custos operacionais", ""),
                "82.19": ("Transferência para resultados líquidos", ""),
                "83": ("Resultados financeiros", "Financial results"),
                "83.1": ("Proveitos e ganhos financeiros gerais", ""),
                "83.2": ("Custos e perdas financeiros gerais", ""),
                "83.9": ("Transferência para resultados líquidos", ""),
                "84": ("Resultados financeiros em filiais e associadas", "Results from subsidiaries and associates"),
                "84.1": ("Proveitos e ganhos em filiais e associadas", ""),
                "84.2": ("Custos e perdas em filiais e associadas", ""),
                "84.9": ("Transferência para resultados líquidos", ""),
                "85": ("Resultados não operacionais", "Non-operating results"),
                "85.1": ("Proveitos e ganhos não operacionais", ""),
                "85.2": ("Custos e perdas não operacionais", ""),
                "85.9": ("Transferência para resultados líquidos", ""),
                "86": ("Resultados extraordinários", "Extraordinary results"),
                "86.1": ("Proveitos e ganhos extraordinários", ""),
                "86.2": ("Custos e perdas extraordinários", ""),
                "87": ("Imposto sobre os lucros", "Income tax"),
                "88": ("Resultado líquido do exercício", "Net income for the period"),
                "89": ("Dividendos antecipados", "Advanced dividends"),
            }
        },
        "9": {
            "name": "Contabilidade Analítica",
            "description": "Management accounting (optional use)",
            "optional": True,
            "accounts": {}
        }
    }
    
    return build_json_structure(classes)


def build_json_structure(classes):
    """Build hierarchical JSON structure from the complete class/account mapping"""
    result = {
        "version": "1.0",
        "title": "Plano Geral de Contabilidade - Angola",
        "description": "Angolan General Accounting Plan",
        "source": "Decreto nº 82/01 de 16 de Novembro",
        "classes": []
    }
    
    # Main account names (2-digit accounts)
    main_account_names = {
        "11": "Imobilizações corpóreas",
        "12": "Imobilizações incorpóreas",
        "13": "Investimentos financeiros",
        "14": "Imobilizações em curso",
        "18": "Amortizações acumuladas",
        "19": "Provisões para investimentos financeiros",
        "21": "Compras",
        "22": "Matérias-primas, subsidiárias e de consumo",
        "23": "Produtos e trabalhos em curso",
        "24": "Produtos acabados e intermédios",
        "25": "Sub-produtos, desperdícios, resíduos e refugos",
        "26": "Mercadorias",
        "27": "Matérias-primas, mercadorias e outros materiais em trânsito",
        "28": "Adiantamentos por conta de compras",
        "29": "Provisão para depreciação de existências",
        "31": "Clientes",
        "32": "Fornecedores",
        "33": "Empréstimos",
        "34": "Estado",
        "35": "Entidades participantes e participadas",
        "36": "Pessoal",
        "37": "Outros valores a receber e a pagar",
        "38": "Provisões para cobranças duvidosas",
        "39": "Provisões para outros riscos e encargos",
        "41": "Títulos negociáveis",
        "42": "Depósitos a prazo",
        "43": "Depósitos à ordem",
        "44": "Outros depósitos",
        "45": "Caixa",
        "48": "Conta transitória",
        "49": "Provisões para aplicações de tesouraria",
        "51": "Capital",
        "52": "Acções/quotas próprias",
        "53": "Prémios de emissão",
        "54": "Prestações suplementares",
        "55": "Reservas legais",
        "56": "Reservas de reavaliação",
        "57": "Reservas com fins especiais",
        "58": "Reservas livres",
        "61": "Vendas",
        "62": "Prestações de serviço",
        "63": "Outros proveitos operacionais",
        "64": "Variação nos inventários de produtos acabados e de produção em curso",
        "65": "Trabalhos para a própria empresa",
        "66": "Proveitos e ganhos financeiros gerais",
        "67": "Proveitos e ganhos financeiros em filiais e associadas",
        "68": "Outros proveitos e ganhos não operacionais",
        "69": "Proveitos e ganhos extraordinários",
        "71": "Custo das existências vendidas",
        "72": "Custos com o pessoal",
        "73": "Amortizações do exercício",
        "75": "Outros custos e perdas operacionais",
        "76": "Custos e perdas financeiros gerais",
        "77": "Custos e perdas financeiros em filiais e associadas",
        "78": "Outros custos e perdas não operacionais",
        "79": "Custos e perdas extraordinárias",
        "81": "Resultados transitados",
        "82": "Resultados operacionais",
        "83": "Resultados financeiros",
        "84": "Resultados financeiros em filiais e associadas",
        "85": "Resultados não operacionais",
        "86": "Resultados extraordinários",
        "87": "Imposto sobre os lucros",
        "88": "Resultado líquido do exercício",
        "89": "Dividendos antecipados",
    }
    
    for class_code in sorted(classes.keys()):
        class_info = classes[class_code]
        
        class_data = {
            "code": class_code,
            "name": class_info["name"],
            "description": class_info["description"]
        }
        
        if class_info.get("optional"):
            class_data["optional"] = True
            class_data["note"] = "Uso facultativo. Recomendado para empresas industriais."
        
        # Build account hierarchy
        accounts_dict = {}
        
        # Add main accounts that are missing
        existing_codes = set(class_info["accounts"].keys())
        main_accounts_needed = set()
        
        # Find which main accounts we need based on existing sub-accounts
        for acc_code in existing_codes:
            if '.' in acc_code:
                main_account = acc_code.split('.')[0]
                if main_account not in existing_codes and main_account in main_account_names:
                    main_accounts_needed.add(main_account)
        
        # Add the missing main accounts
        for main_acc in main_accounts_needed:
            if main_acc in main_account_names:
                accounts_dict[main_acc] = {
                    "code": main_acc,
                    "name": main_account_names[main_acc],
                    "description": ""
                }
        
        # Add all existing accounts
        for acc_code, (acc_name, acc_desc) in class_info["accounts"].items():
            accounts_dict[acc_code] = {
                "code": acc_code,
                "name": acc_name,
                "description": acc_desc if acc_desc else ""
            }
        
        # Build tree structure
        class_data["accounts"] = build_tree(accounts_dict)
        result["classes"].append(class_data)
    
    return result


def build_tree(accounts_dict):
    """Build tree structure from flat account dictionary"""
    roots = []
    children_map = defaultdict(list)
    
    # Group accounts by parent
    for code, data in accounts_dict.items():
        parts = code.split('.')
        if len(parts) == 1:  # Root level - main accounts (e.g., "11", "21", "32")
            roots.append(code)
        else:
            parent = '.'.join(parts[:-1])
            children_map[parent].append(code)
    
    def build_node(code):
        node = accounts_dict[code].copy()
        if code in children_map:
            children = []
            for child_code in sorted(children_map[code], key=lambda x: [int(p) if p.isdigit() else p for p in x.split('.')]):
                children.append(build_node(child_code))
            if children:
                node["children"] = children
        # Remove empty descriptions
        if not node.get("description"):
            del node["description"]
        return node
    
    # Build tree for root accounts
    tree = []
    for root_code in sorted(roots, key=lambda x: [int(p) if p.isdigit() else p for p in x.split('.')]):
        tree.append(build_node(root_code))
    
    return tree


def create_flat_structure(hierarchical_data):
    """Create flat structure with parent references"""
    flat = []
    
    for class_data in hierarchical_data["classes"]:
        # Add class
        flat.append({
            "code": class_data["code"],
            "name": class_data["name"],
            "description": class_data.get("description", ""),
            "level": 1,
            "parent": None,
            "type": "class",
            "optional": class_data.get("optional", False)
        })
        
        # Flatten accounts
        def flatten_account(account, parent, level):
            # Calculate level from code structure
            # Level 2: Main accounts (11, 12, 21, etc.) - no dots
            # Level 3: Sub-accounts (11.1, 21.1, etc.) - 1 dot
            # Level 4+: Further sub-levels
            code_parts = account["code"].split('.')
            calculated_level = len(code_parts) + 1  # +1 because class is level 1
            
            entry = {
                "code": account["code"],
                "name": account["name"],
                "description": account.get("description", ""),
                "level": calculated_level,
                "parent": parent,
                "type": "account"
            }
            flat.append(entry)
            
            if "children" in account:
                for child in account["children"]:
                    flatten_account(child, account["code"], calculated_level + 1)
        
        for account in class_data["accounts"]:
            flatten_account(account, class_data["code"], 2)
    
    return flat


def main():
    print("Parsing PGC with comprehensive account structure...")
    
    # Parse complete structure
    hierarchical_data = parse_pgc_complete()
    
    # Count accounts
    total_accounts = 0
    for class_data in hierarchical_data["classes"]:
        class_accounts = count_accounts(class_data["accounts"])
        total_accounts += class_accounts
    
    # Save hierarchical JSON
    with open("pgc_chart_of_accounts.json", "w", encoding="utf-8") as f:
        json.dump(hierarchical_data, f, ensure_ascii=False, indent=2)
    print(f"✓ Created pgc_chart_of_accounts.json ({total_accounts} accounts)")
    
    # Save flat JSON
    flat_data = create_flat_structure(hierarchical_data)
    with open("pgc_chart_of_accounts_flat.json", "w", encoding="utf-8") as f:
        json.dump(flat_data, f, ensure_ascii=False, indent=2)
    print(f"✓ Created pgc_chart_of_accounts_flat.json ({len(flat_data)} entries)")
    
    # Print summary
    print("\n=== Summary ===")
    for class_data in hierarchical_data["classes"]:
        class_accounts = count_accounts(class_data["accounts"])
        optional = " (optional)" if class_data.get("optional") else ""
        print(f"Class {class_data['code']}: {class_data['name']}{optional} - {class_accounts} accounts")
    
    print(f"\nTotal: {total_accounts} accounts across {len(hierarchical_data['classes'])} classes")


def count_accounts(accounts_list):
    """Recursively count all accounts"""
    count = len(accounts_list)
    for account in accounts_list:
        if "children" in account:
            count += count_accounts(account["children"])
    return count


if __name__ == "__main__":
    main()

