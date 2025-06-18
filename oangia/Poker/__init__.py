if __name__ == '__main__':
  deck = Deck()
  cards = deck.deal('1s,1c,1d,1h,10s')
  hand = Hand(cards)
  hand.stats()
