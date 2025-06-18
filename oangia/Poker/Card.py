class Card:
    SUIT = {'s': 0, 'c': 1, 'd': 7, 'h': 23}
    def __init__(self, name):
        self.name = name
        self.rank = int(name[:-1])
        self.rank_value = 12 if self.rank == 1 else self.rank - 2
        self.rank_point = pow(2, self.rank_value)

        self.suit = name[-1]
        self.suit_point = self.SUIT[self.suit];

    def __repr__(self):
        return self.name
