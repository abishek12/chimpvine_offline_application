class InteractiveContent {
  final String title;
  final String image;
  final String path;

  InteractiveContent({
    required this.title,
    required this.image,
    required this.path,
  });

  factory InteractiveContent.fromJson(Map<String, dynamic> json) {
    return InteractiveContent(
      title: json['title'],
      image: json['image'],
      path: json['path'],
    );
  }
}

class Game {
  final String title;
  final String image;
  final String path;

  Game({
    required this.title,
    required this.image,
    required this.path,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      title: json['title'],
      image: json['image'],
      path: json['path'],
    );
  }
}

class SearchResults {
  final List<InteractiveContent> interactiveContents;
  final List<Game> games;

  SearchResults({
    required this.interactiveContents,
    required this.games,
  });

  factory SearchResults.fromJson(Map<String, dynamic> json) {
    List<InteractiveContent> interactiveContents = (json['ic'] as List)
        .map((data) => InteractiveContent.fromJson(data))
        .toList();

    List<Game> games =
        (json['games'] as List).map((data) => Game.fromJson(data)).toList();

    return SearchResults(
      interactiveContents: interactiveContents,
      games: games,
    );
  }
}
