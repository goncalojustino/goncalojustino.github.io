# Research.html redesign and expansion

Modify only:

`https://goncalojustino.github.io/Research.html`

Do not redesign the rest of the website. Preserve the site's existing navigation, typography, visual identity, header/footer, and responsive behaviour.

The goal is to restructure the Research page around three more coherent research pillars:

1. **Omics & Systems Biology**
2. **Molecular Mechanisms of Disease & Drug Action**
3. **Computational & Molecular Biochemistry**

Mass spectrometry, bioinformatics, computational analysis, and molecular modelling should be presented primarily as enabling technologies that support the broader research programme, rather than as isolated research themes.

---

# 1. Overall page logic

The page should communicate a research programme built around three complementary levels:

**Measure biological change → understand molecular mechanisms → model and integrate molecular information**

The page should contain:

1. a concise general introduction;
2. three overview cards;
3. three substantial sections further down the same page;
4. anchor navigation from each card to its detailed section.

Do not create separate HTML pages yet.

The three detailed sections should be substantial enough that they could later be extracted into independent subpages if needed.

---

# 2. Main introduction

Keep a strong general heading such as:

## Molecular mechanisms in health, disease & drug action

Suggested introductory text:

> We investigate how biological systems change in health, disease, and response to therapeutic and chemical perturbations. Our research combines proteomics, metabolomics, systems biology, molecular biochemistry, mass spectrometry, bioinformatics, molecular modelling, and data-driven computational approaches to connect molecular measurements with biological mechanisms.

> Rather than treating these methods as separate research areas, we integrate them across different biological questions: characterizing molecular states, understanding how disease and drugs perturb biological systems, and developing computational and molecular models that help explain the resulting changes.

Optionally add a compact keyword line:

**Proteomics · Metabolomics · Multi-omics · Systems Biology · Mass Spectrometry · Bioinformatics · Molecular Modelling · AI**

---

# 3. Three overview cards

Replace the current three research cards with:

## Omics & Systems Biology

Short description:

> Proteomics, metabolomics, and multi-omics approaches to characterize biological states, quantify responses to disease and chemical perturbation, identify biomarkers, and reconstruct affected pathways and molecular networks.

Anchor:

`#omics-systems-biology`

---

## Molecular Mechanisms of Disease & Drug Action

Short description:

> Experimental and systems-level investigation of how disease, therapeutic agents, and xenobiotics alter cellular and molecular processes, with applications in cancer, antimicrobial resistance, neurobiology, and adverse drug responses.

Anchor:

`#molecular-mechanisms`

---

## Computational & Molecular Biochemistry

Short description:

> Bioinformatics, molecular modelling, molecular dynamics, protein–ligand analysis, computational omics, and emerging AI-based approaches for understanding molecular interactions and complex biological datasets.

Anchor:

`#computational-molecular-biochemistry`

Make the complete card clickable where possible.

Use smooth scrolling.

---

# 4. Conceptual transition

Below the three cards, add a small conceptual sequence:

**Measure → Explain → Model**

with:

**Omics & Systems Biology**  
Measure and organize molecular change

→

**Molecular Mechanisms of Disease & Drug Action**  
Explain biological response

→

**Computational & Molecular Biochemistry**  
Model, integrate, and interpret molecular systems

This should be visually understated.

The objective is to show that the three pillars are strongly connected rather than independent research programmes.

---

# 5. Research pillar 1

Create:

```html
<section id="omics-systems-biology">
```

Main heading:

# Omics & Systems Biology

Subtitle:

**From molecular measurements to biological systems**

This section should establish proteomics and metabolomics as central experimental approaches while emphasizing systems-level interpretation rather than simply analytical measurement.

Suggested introductory text:

> Proteins and metabolites provide complementary views of biological state. We use quantitative proteomics, metabolomics, and multi-omics approaches to characterize how these molecular systems change in disease, during cellular adaptation, and following exposure to therapeutic agents or other chemical perturbations.

> Our objective is not simply to identify molecules whose abundance changes. Differential molecular profiles are interpreted in terms of biochemical pathways, interaction networks, cellular processes, and coordinated biological responses. This systems-level perspective allows individual molecular observations to be placed within the broader organization of the cell or organism.

> High-resolution mass spectrometry provides much of the experimental foundation for these studies, while statistical analysis, bioinformatics, pathway analysis, and network biology provide the framework required to convert molecular measurements into biological interpretation.

Add the following subsections.

## Quantitative proteomics

> We use mass-spectrometry-based proteomics to characterize changes in protein abundance, protein composition, and regulatory processes across biological conditions. Depending on the biological question, these analyses can range from broad proteome profiling to focused investigation of specific pathways, protein families, or post-translational modifications.

Emphasize applications including:

- disease-associated proteome changes;
- drug and xenobiotic perturbation;
- antimicrobial response;
- cancer cell biology;
- clinical molecular characterization;
- protein biomarkers.

---

## Metabolomics

> Metabolomics provides a complementary view of cellular and systemic physiology by directly measuring changes in small molecules associated with metabolic activity. We use metabolomic approaches to investigate altered pathways, cellular adaptation, metabolic consequences of drug exposure, and interactions between metabolism and broader molecular responses.

The emphasis should be on biological interpretation rather than analytical chemistry alone.

---

## Multi-omics integration

> Proteomic and metabolomic datasets describe different layers of the same biological system. We investigate strategies for integrating these layers in order to identify coordinated molecular responses, connect changes in enzymes with changes in metabolites, and reconstruct broader alterations in biochemical pathways and cellular functions.

---

## Pathways and molecular networks

> Molecular changes are interpreted through pathway enrichment, protein interaction networks, metabolic pathways, functional annotation, and systems-level modelling. These approaches help distinguish isolated molecular effects from coordinated biological programmes.

---

## Biomarkers and molecular signatures

> We investigate individual biomarkers as well as multivariate molecular signatures associated with disease states, biological responses, or therapeutic effects. These signatures can provide both practical discriminatory information and insight into the underlying biological mechanisms.

At the end, include:

**Proteomics · Metabolomics · Multi-omics · Quantitative mass spectrometry · Biomarkers · Pathway analysis · Network biology · Systems biology**

---

# 6. Research pillar 2

Create:

```html
<section id="molecular-mechanisms">
```

Main heading:

# Molecular Mechanisms of Disease & Drug Action

Subtitle:

**Understanding how biological systems respond to disease and chemical perturbation**

This should be the most biologically driven section.

It should focus on questions and biological systems rather than techniques.

Suggested introductory text:

> Disease and pharmacological response emerge from alterations in interconnected molecular processes rather than from isolated changes in individual proteins or metabolites. We investigate how these processes are reorganized in disease and following exposure to therapeutic agents, xenobiotics, and other chemical perturbations.

> Experimental biochemistry, cell biology, omics, molecular interaction studies, and computational analysis are combined to determine how molecular perturbations propagate through biological systems. Particular attention is given to adaptive responses, altered metabolism, cellular stress, signalling, protein regulation, and molecular interactions associated with therapeutic efficacy or toxicity.

> Although the biological systems investigated are diverse, the underlying question is consistent: how does a molecular perturbation produce a measurable biological response, and which mechanisms determine adaptation, dysfunction, resistance, or therapeutic outcome?

Add the following thematic subsections.

## Cancer biology and anticancer agents

> We investigate how cancer cells respond to therapeutic compounds and experimental perturbations at the molecular and systems levels. Proteomic, metabolomic, biochemical, and computational approaches are used to identify altered pathways, cellular stress responses, metabolic reprogramming, and mechanisms associated with drug activity.

Where appropriate, this can include studies involving metal-based or other experimental therapeutic compounds.

---

## Antimicrobial resistance and MRSA

> Antimicrobial resistance provides a particularly clear example of biological adaptation to chemical pressure. We investigate how bacterial cells, including methicillin-resistant *Staphylococcus aureus*, reorganize their proteome, metabolism, transport systems, stress responses, and regulatory pathways following antibiotic exposure.

> These studies aim to distinguish direct antibiotic effects from adaptive responses and to identify molecular processes that may contribute to resistance, tolerance, or potential therapeutic sensitization.

---

## Neurobiology and neurodegeneration

> We investigate molecular processes relevant to neuronal function, neurobiological disease, and pharmacological modulation of neuronal systems. Omics and biochemical approaches are used to characterize changes associated with neuronal state, neurodegenerative processes, and exposure to therapeutic compounds.

Keep this sufficiently general to accommodate different current and future neuronal models.

---

## Adverse drug reactions

> Individual responses to therapeutic agents may result from differences in metabolism, molecular targets, compensatory pathways, and broader physiological context. We investigate molecular signatures and mechanisms associated with adverse drug responses, combining omics data with biochemical and pharmacological interpretation.

---

## Xenobiotic response and mechanisms of drug action

> Therapeutic agents and other xenobiotics can be considered controlled perturbations of biological systems. By following molecular responses across proteins, metabolites, pathways, and molecular interactions, we aim to understand both intended pharmacological effects and secondary adaptive or toxic responses.

---

## From perturbation to mechanism

> Across these biological systems, the central objective is to move from lists of altered molecules toward mechanistic explanations. Molecular measurements are integrated with biochemical pathways, interaction networks, structural information, and experimental context to reconstruct the processes that connect exposure with biological outcome.

At the end, include:

**Cancer · Antimicrobial resistance · MRSA · Neurobiology · Neurodegeneration · Adverse drug reactions · Xenobiotic response · Drug mechanisms**

---

# 7. Research pillar 3

Create:

```html
<section id="computational-molecular-biochemistry">
```

Main heading:

# Computational & Molecular Biochemistry

Subtitle:

**Connecting molecular structure, interactions, and biological data**

This section should combine molecular-scale computational work with computational interpretation of large biological datasets.

It should not read as a generic bioinformatics section.

Suggested introductory text:

> Many biological mechanisms can only be understood by connecting molecular-scale interactions with systems-level observations. We use computational biochemistry and bioinformatics to investigate this connection, combining molecular modelling with computational analysis of proteomic, metabolomic, and other biological data.

> These approaches span multiple scales. At the molecular level, structural modelling and molecular simulations help explain interactions between proteins, metabolites, drugs, and other small molecules. At the systems level, computational workflows are used to process, integrate, and interpret high-dimensional biological datasets.

> Increasingly, machine-learning and artificial-intelligence methods provide additional ways to represent complex molecular information, identify patterns in biological data, and integrate knowledge across molecular scales.

Add the following subsections.

## Bioinformatics and computational omics

> We develop and apply computational workflows for quantitative proteomics, metabolomics, annotation, statistical analysis, pathway enrichment, network analysis, visualization, and integration of heterogeneous biological datasets.

This should make clear that computational workflows are developed when existing tools do not adequately address specific biological questions.

---

## Molecular modelling

> Structural and molecular modelling approaches are used to investigate the molecular basis of interactions between proteins, metabolites, therapeutic agents, and other ligands. These studies provide hypotheses that can be compared with experimental biochemical and omics observations.

---

## Molecular dynamics

> Molecular dynamics simulations are used to investigate conformational behaviour, molecular recognition, stability, and interaction mechanisms that cannot be fully captured by static structural models.

Do not overstate predictive power.

---

## Protein–ligand interactions

> Experimental and computational analysis of protein–ligand interactions provides a molecular-scale view of drug action and biochemical regulation. Docking, molecular simulation, binding analysis, spectroscopy, and complementary biochemical measurements can be integrated to characterize interaction mechanisms.

---

## Computational systems biology

> Computational approaches are used to connect individual molecular changes with pathways, networks, and broader biological states. Particular emphasis is placed on integrating quantitative experimental measurements with prior biochemical knowledge rather than treating computational analysis as a purely statistical exercise.

---

## Artificial intelligence and data-driven molecular biology

> Machine learning and artificial intelligence provide new methods for representing proteins, metabolites, molecular structures, and complex biological states. We are interested particularly in approaches that can complement experimental molecular biology and omics by improving data integration, biological interpretation, and generation of mechanistic hypotheses.

> Emerging directions include representation learning for molecular and omics data, biological foundation models, AI-assisted interpretation of proteomic and metabolomic datasets, and computational descriptions of biological states derived from high-dimensional molecular measurements.

At the end, include:

**Bioinformatics · Computational biochemistry · Molecular modelling · Molecular dynamics · Protein–ligand interactions · Computational omics · Machine learning · Artificial intelligence**

---

# 8. Relationship between technologies and research themes

A major conceptual change from the current page is that technologies should not define the research programme by themselves.

In particular:

## Mass spectrometry

Do not create a standalone "Mass Spectrometry" research pillar.

Instead, describe mass spectrometry as a central enabling technology across:

- proteomics;
- metabolomics;
- biomarker discovery;
- molecular diagnostics;
- disease perturbation studies;
- drug-response studies.

This reflects its actual role more accurately.

---

## Computational methods

Likewise, computational analysis should appear throughout the page.

For example:

- Omics & Systems Biology uses bioinformatics, statistics, pathways, and networks.
- Molecular Mechanisms uses computational interpretation to build mechanistic models.
- Computational & Molecular Biochemistry develops these approaches further and applies molecular-scale modelling and AI.

Therefore, avoid language suggesting that experimental and computational research occur independently.

---

# 9. Suggested overall scientific narrative

The page should communicate the following progression:

### 1. Observe

Measure proteins, metabolites, and other molecular properties.

### 2. Organize

Identify coordinated pathways, networks, and molecular signatures.

### 3. Explain

Determine how disease, drugs, xenobiotics, and biological adaptation generate those changes.

### 4. Model

Use computational and molecular approaches to integrate observations and investigate mechanisms across molecular scales.

This scientific narrative is more important than presenting a catalogue of techniques.

---

# 10. Expanded-section layout

Each major research section should contain:

- large section title;
- concise subtitle;
- 2–3 introductory paragraphs;
- 4–6 thematic subsections;
- one relevant image or visual element if suitable;
- keyword/method line at the end.

Avoid putting every subsection inside a separate box.

Use editorial-style sections with whitespace and clear typography.

On desktop, selected subsections can use a two-column layout.

On mobile, use a single-column layout.

---

# 11. Images

Keep or adapt the current visual language, but make the images correspond to the revised pillars.

Preferred conceptual content:

### Omics & Systems Biology

Visual elements may include:

- mass spectra;
- proteins;
- metabolites;
- pathway maps;
- molecular networks;
- quantitative heatmaps.

The image should convey integration rather than only an instrument.

### Molecular Mechanisms of Disease & Drug Action

Visual elements may include:

- cells;
- bacteria;
- cancer biology;
- neuronal systems;
- therapeutic molecules;
- molecular pathways responding to perturbation.

Avoid making this look exclusively like pharmacology.

### Computational & Molecular Biochemistry

Visual elements may include:

- protein structures;
- ligands;
- molecular dynamics;
- interaction networks;
- computational data representations;
- omics matrices.

Avoid generic "AI brain" imagery.

---

# 12. Navigation

Top cards should link to:

```text
#omics-systems-biology
#molecular-mechanisms
#computational-molecular-biochemistry
```

Apply `scroll-margin-top` so the fixed navbar does not obscure headings.

Use CSS smooth scrolling where compatible with the current site.

Optionally include a subtle:

**Back to research overview ↑**

link after each detailed section.

No floating menu is necessary.

---

# 13. Writing principles

Use scientifically precise language.

The hierarchy should always be:

**biological question → molecular measurement → mechanistic interpretation → computational integration**

Avoid structuring the page as:

**instrument → software → technique → technique → technique**

Avoid excessive repetition of:

- mass spectrometry;
- proteomics;
- metabolomics;
- "multi-omics";
- "precision medicine".

Mention them where scientifically relevant, but do not repeat the same methodological sentence across all three sections.

Avoid promotional language such as:

- groundbreaking;
- cutting-edge;
- revolutionary;
- transformative.

---

# 14. Technical implementation constraints

Before editing:

1. inspect the existing `Research.html`;
2. inspect styles/classes currently used by this page;
3. reuse existing CSS where possible;
4. preserve navbar and footer;
5. do not introduce another CSS framework;
6. avoid unnecessary JavaScript;
7. preserve mobile responsiveness;
8. avoid global CSS changes that could alter other pages;
9. use semantic HTML;
10. keep heading hierarchy logical;
11. keep existing site-wide navigation links unchanged.

Page-specific CSS additions are acceptable.

---

# 15. Final page hierarchy

The resulting page should approximately be:

```text
RESEARCH

Molecular mechanisms in health, disease & drug action

General research introduction

Proteomics · Metabolomics · Multi-omics · Systems Biology ·
Mass Spectrometry · Bioinformatics · Molecular Modelling · AI


[ OMICS & SYSTEMS BIOLOGY ]
[ MOLECULAR MECHANISMS OF DISEASE & DRUG ACTION ]
[ COMPUTATIONAL & MOLECULAR BIOCHEMISTRY ]


Measure → Explain → Model


OMICS & SYSTEMS BIOLOGY
From molecular measurements to biological systems

Quantitative proteomics
Metabolomics
Multi-omics integration
Pathways and molecular networks
Biomarkers and molecular signatures


MOLECULAR MECHANISMS OF DISEASE & DRUG ACTION
Understanding biological responses to disease and chemical perturbation

Cancer biology and anticancer agents
Antimicrobial resistance and MRSA
Neurobiology and neurodegeneration
Adverse drug reactions
Xenobiotic response and mechanisms of drug action
From perturbation to mechanism


COMPUTATIONAL & MOLECULAR BIOCHEMISTRY
Connecting molecular structure, interactions, and biological data

Bioinformatics and computational omics
Molecular modelling
Molecular dynamics
Protein–ligand interactions
Computational systems biology
Artificial intelligence and data-driven molecular biology
```

The resulting Research page should communicate one integrated research programme rather than three largely method-defined activities.

The central conceptual structure is:

**Omics tells us what changed.**

**Mechanistic biology asks why it changed and what the consequences are.**

**Computational and molecular biochemistry help connect those changes to molecular interactions and biological models.**