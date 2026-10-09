---
publish: true
content_type: "post"
title: "Unlocking the Regulatory Genome by ARGUS: An Evidence-Constrained Agentic Framework for Interpreting Single Nucleotide Variants"
description: "More than 90% of disease-associated variants from genome-wide association studies fall in noncoding regulatory regions, yet interpreting their function remains a central open problem in genomic medicine. Large language models prompted to in"
date: "2026-10-08T16:38:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12281v1"
tags: ["source/arxiv","topics/agents","topics/research","topics/evaluation"]
---

More than 90% of disease-associated variants from genome-wide association studies fall in noncoding regulatory regions, yet interpreting their function remains a central open problem in genomic medicine. Large language models prompted to interpret such variants routinely hallucinate transcription factor &#40;TF&#41; binding changes, fabricate experimental support, and assign biological significance to statistically negligible signals.

The authors present ARGUS &#40;Agentic Regulatory Genomics for an Uncertainty-aware Scientist&#41;, which strictly separates deterministic biological computation from LLM-mediated reasoning. ARGUS wraps 458 DNABERT-based TF binding models in a hypothesis-directed investigation loop: a planner selects evidence sources based on current uncertainty, a verifier deterministically interprets each observation, and intermediate results change the investigation path.

On variant rs6983267 at the 8q24 cancer risk locus, the same planner produces four divergent trajectories for four TFs: FOXA1 is rescued in 3 steps when real ADASTRA allele-specific binding data &#40;15 experiments, FDR = 0.030&#41; reveals a model false negative masked by saturation; KLF6 traverses 8 steps across ADASTRA, JASPAR motif analysis and ENCODE cCRE regulatory annotation before abstaining due to mixed indirect evidence; RAD21 abstains in 8 steps after ADASTRA returns a coverage-qualified but nonsignificant allelic test &#40;5 experiments, FDR = 0.65&#41;; and SP1, which shares FOXA1's saturated retained prediction, abstains because no direct experimental evidence exists at this locus. All observations come from real ADASTRA, JASPAR and ENCODE cCRE queries rather than simulation. Comparing fixed-priority and LLM-mediated planning, the LLM planner reaches identical verdicts with fewer tool calls by declining evidence that cannot resolve the claim under test.
