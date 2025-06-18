import random

class Deck:
    def __init__(self):
        self.suits = ['s', 'c', 'd', 'h']
        self.ranks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']
        self.reset()

    def reset(self):
        self.deck = [Card(f'{rank}{suit}') for suit in self.suits for rank in self.ranks]

    def random(self, num_cards=5):
        random.shuffle(self.deck)
        if num_cards > len(self.deck):
            raise ValueError("Not enough cards in the deck to deal the requested number of cards.")
        dealt_cards = self.deck[:num_cards]
        self.deck = self.deck[num_cards:]
        return dealt_cards

    def deal(self, cards):
        return [Card(card) for card in cards.split(',')]
