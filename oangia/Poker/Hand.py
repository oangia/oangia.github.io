import Card

class HandRank:

  STRAIGHT = [31, 62, 124, 248, 496, 992, 1984, 3968, 4111, 7936]
  FLUSH = [0, 5, 35, 115]

  def __init__(self, hand):
    self.cards = hand.cards
    self.straight = False
    self.flush = False
    self.royal = False
    self.straight_flush = False
    self.low_ace = False

    self.cards = sorted(hand.cards, key = lambda card: (card.rank, card.suit))
    self.zitch_point = sum(card.rank_point for card in self.cards)
    self.suit_point = sum(card.suit_point for card in self.cards)

    self.middleCardPoint = self.cards[2].rank_point
    self.middleSide = self.cards[1].rank_point + self.cards[3].rank_point


    if self.zitch_point == 7936:
      self.royal = True
    if self.zitch_point == 4111:
      self.low_ace = True
    if self.zitch_point in self.STRAIGHT:
      self.straight = True
    if self.suit_point in self.FLUSH:
      self.flush = True
    if self.flush and self.straight:
      self.straight_flush = True

    self.rank = self.getRank()

  def getRank(self):
    if self.flush:
      if self.royal:
        return 'Royal Flush'
      if self.straight_flush:
        return 'Straight Flush'
      return 'Flush'

    if self.straight:
      return 'Straight'

    return 'High Card'

class HandPoint:
  RANK = {
    'Royal Flush': 90,
    'Straight Flush': 80,
    'Four of a Kind': 70,
    'Full House': 60,
    'Flush': 50,
    'Straight': 40,
    'Three of a Kind': 30,
    'Two Pair': 20,
    'One Pair': 10,
    'High Card': 0
  }
  MAX_ZITCH_POINT = 7937
  MAX_CARD_POINT = 4097
  MAX_TWO_CARD_POINT = 6145

  def __init__(self, hand):
    self.hand = hand
    self.point = self.calculate_point()

  def calculate_point(self):
    point = self.RANK[self.hand.rank]
    # zitch point
    if self.hand.rank in ['Royal Flush', 'Straight Flush', 'Flush', 'Straight', 'High Card']:
      point += self.hand.zitch_point * 10 / self.MAX_ZITCH_POINT

    # middle card
    if self.hand.rank in ['Four of a Kind', 'Full House', 'Three of a Kind']:
      point += self.hand.cards[2].rank_point * 10 / self.MAX_CARD_POINT

    # two middle side
    if self.hand.rank == 'Two Pair':
      point += (self.hand.cards[1].rank_point + self.hand.cards[3].rank_point) * 10 / self.MAX_TWO_CARD_POINT

    # Duplicate + zitch point
    if self.hand.rank == 'One Pair':
      for i in range(4):
        if self.hand.cards[i].rank == self.hand.cards[i+1].rank:
          point += self.hand.cards[i].rank_point * 10 / self.MAX_CARD_POINT
        else:
          point += self.hand.cards[i].rank_point / self.MAX_ZITCH_POINT

    return point

class Hand:
    def __init__(self, cards, chiAt = False):
      self.cards = cards
      self.rank = HandRank(self)
      print(self.rank.getRank())

    def stats(self, resType='print'):
      feature = {
          "hand": ','.join([card.name for card in self.cards]),
          "zitch_point": self.rank.zitch_point,
          "straight": self.rank.straight,
          "suit_point": self.rank.suit_point,
          "flush": self.rank.flush,
          "straight_flush": self.rank.straight_flush,
          "royal": self.rank.royal,
          "low_ace": self.rank.low_ace,
          "rank": self.rank.rank,
          "middle_card_point": self.rank.middleCardPoint
      }
      if resType == 'json':
        return feature
      else:
        for key, value in feature.items():
          print(f"{key}: {value}")
