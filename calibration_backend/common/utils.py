import json


def load_questions():
    with open("../raw_data/questions_pack_science.txt", "r") as fp:
        questions = json.load(fp)
        return questions


def make_to_dict_clsfn(field_list):
    def to_json(self):
        return {field: self.__dict__[field] for field in field_list}
    return to_json


VALID_PROBABILITY_QUANTS = [-1] + list(range(55, 100, 5)) + [99]
PAGE_SIZE = 5