enum AiTone {
  shorter(label: 'Shorter', promptModifier: 'concise, direct, and brief'),
  friendlier(
    label: 'Friendlier',
    promptModifier: 'warm, enthusiastic, and approachable',
  ),
  moreFormal(
    label: 'More Formal',
    promptModifier: 'professional, courteous, and polished',
  );

  const AiTone({required this.label, required this.promptModifier});

  final String label;
  final String promptModifier;
}
