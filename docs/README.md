# EONIQ
## AI Energy Intelligence Platform

EONIQ es una plataforma de inteligencia energética impulsada por Inteligencia Artificial Generativa diseñada para centralizar conocimiento energético global, visualizar infraestructuras críticas y asistir la toma de decisiones mediante un sistema RAG (Retrieval Augmented Generation) y una arquitectura Multi-Agente especializada.

El proyecto fue desarrollado como práctica final del módulo **Deep Dive LLMs e IA Generativa** de **MIOTI Tech & Business School**.

---

# Problema

La información energética mundial se encuentra fragmentada entre organismos reguladores, operadores de red, compañías energéticas, centros de investigación y publicaciones técnicas.

Esta dispersión dificulta:

* El análisis rápido de infraestructuras energéticas.
* La evaluación de riesgos energéticos.
* La comprensión de políticas energéticas.
* La planificación de nuevas inversiones.
* La consulta de documentación técnica especializada.

Los profesionales del sector deben consultar múltiples fuentes antes de obtener una respuesta confiable.

---

# Solución

EONIQ integra en una única plataforma:

* Visualización geoespacial de infraestructuras energéticas.
* Base documental especializada.
* Sistema de recuperación semántica (RAG).
* Inteligencia conversacional basada en LLMs.
* Arquitectura Multi-Agente por dominio energético.

El sistema permite consultar información energética utilizando lenguaje natural mientras mantiene trazabilidad documental sobre las respuestas generadas.

---

# Arquitectura General

```text
Usuario
    │
    ▼
Frontend Web (Lovable)
    │
    ▼
Chat Inteligente
    │
    ▼
FastAPI Backend
    │
    ▼
Router Multi-Agente
    │
    ├── Spain Agent
    ├── Grid Agent
    ├── Renewables Agent
    ├── Datacenter Agent
    ├── AI Energy Agent
    └── Energy Agent
            │
            ▼
      Sistema RAG
            │
            ▼
     FAISS Vector Store
            │
            ▼
 Documentación Energética
            │
            ▼
Groq + Llama 3.3 70B
            │
            ▼
Respuesta Final
```

---

# Tecnologías Utilizadas

## Frontend

* Lovable
* React
* TypeScript
* MapLibre GL
* Deck.gl
* Zustand

## Backend IA

* Python
* FastAPI
* FAISS
* Sentence Transformers

## Inteligencia Artificial Generativa

* Groq
* Llama 3.3 70B Versatile
* Retrieval Augmented Generation (RAG)

## Infraestructura

* GitHub
* Hugging Face Spaces
* Google Colab

---

# Base Documental

La base documental incorpora documentación especializada procedente de organismos internacionales y actores relevantes del sector energético.

## Energía Global

* World Energy Outlook (IEA)
* Electricity Market Report (IEA)
* Renewables Report (IEA)

## Energías Renovables

* Global Wind Report (GWEC)
* Global Solar Market Report

## Redes Eléctricas

* Electricity Grids and Secure Energy Transitions (IEA)

## Centros de Datos

* Google Environmental Report
* Microsoft Environmental Sustainability Report

## Inteligencia Artificial y Energía

* Electricity 2024 (IEA)
* AI and Energy Demand Report

## España

* PNIEC España
* Red Eléctrica de España
* Estrategia de Almacenamiento Energético

---

# Datos Geoespaciales

Dataset principal:

* Global Power Plant Database (World Resources Institute)

Activos energéticos integrados:

* 34.936 centrales eléctricas reales
* Información georreferenciada global
* Clasificación tecnológica por tipo de generación

---

# Sistema Multi-Agente

El sistema implementa una arquitectura de agentes especializados:

### Spain Agent

Especializado en regulación y planificación energética española.

### Grid Agent

Especializado en redes eléctricas, transmisión e interconexiones.

### Renewables Agent

Especializado en tecnologías renovables.

### Datacenter Agent

Especializado en infraestructura digital y centros de datos.

### AI Energy Agent

Especializado en la relación entre inteligencia artificial y consumo energético.

### Energy Agent

Especialista generalista para consultas energéticas globales.

Todos los agentes son coordinados por un Router Inteligente que identifica automáticamente el dominio de la consulta y selecciona el agente más adecuado.

---

# Notebooks del Proyecto

## Notebook 1

Construcción de la Base Documental

* Procesamiento de documentos PDF
* Chunking
* Embeddings
* Construcción del índice vectorial

## Notebook 2

Validación del Sistema RAG

* Recuperación semántica
* Evaluación de resultados
* Verificación de fuentes

## Notebook 3

Sistema Multi-Agente

* Router
* Agentes especializados
* Orquestación de consultas

---

# Despliegue

Frontend Web:

[https://eoniq-ai.lovable.app/]

Backend IA:

(https://hanslaston-energy-intelligence-api.hf.space)

Repositorio:

https://github.com/cruxshadows007/Eoniq-AI

---

# Resultados

* Plataforma web funcional desplegada.
* Sistema RAG operativo.
* Arquitectura Multi-Agente.
* Más de 34.000 activos energéticos reales integrados.
* Respuestas con trazabilidad documental.
* Integración de IA Generativa aplicada al sector energético.

---

# Autor

Proyecto desarrollado por: Hans Asto M.

Práctica Final — Deep Dive LLMs e Inteligencia Artificial Generativa

MIOTI Tech & Business School
