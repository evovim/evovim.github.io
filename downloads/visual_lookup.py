"""Replay an archive lookup through the EvoViM starter memory program.

After extracting archive_lookup.zip and installing the EvoViM wheel, run:

    python visual_lookup.py apollo --sample 2
    python visual_lookup.py monet --sample 1

This offline example uses a scripted controller. It searches saved photographs
for an unaltered crop. It does not run program evolution or a trained model.
The collection manifest includes the original record for each photograph.
"""

import argparse
import json
from importlib.resources import files
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image
from visual_rsi.adapters.base import PublicObs, StepResult
from visual_rsi.host.episode import run_episode
from visual_rsi.host.model import ModelReply


def read_rgb(path):
    with Image.open(path) as image:
        return image.convert('RGB')


def contains_crop(frame, query):
    """Find an exact crop without using the record's annotated location."""
    if query.width > frame.width or query.height > frame.height:
        return False
    pixels = frame.tobytes()
    patch = query.tobytes()
    # A match must contain the first row, aligned to a full RGB pixel.
    first_row = patch[:query.width * 3]
    offset = pixels.find(first_row)
    while offset >= 0:
        y, x = divmod(offset // 3, frame.width)
        if offset % 3 == 0 and x + query.width <= frame.width and y + query.height <= frame.height:
            if frame.crop((x, y, x + query.width, y + query.height)).tobytes() == patch:
                return True
        offset = pixels.find(first_row, offset + 1)
    return False


class LookupAdapter:
    name = 'visual_lookup'
    public_text_fields = ('long_term_context', 'short_term_context')
    has_image = True
    fallback_action = 'Next'
    max_steps = 4

    def __init__(self, records, sample, directory):
        self.records = [record['id'] for record in records]
        self.frames = [read_rgb(directory / record['image']) for record in records]
        self.query = read_rgb(directory / records[sample]['query'])
        self.sample = sample

    def reset(self, seed):
        self.position = 0

    def legal_actions(self):
        return ['Next', *self.records]

    def task_instruction(self):
        return 'Visit three records. When the question appears, answer with the source of its image.'

    def metric_description(self):
        return 'Correct archive record for the query detail.'

    def observe(self):
        if self.position < len(self.frames):
            image = self.frames[self.position]
            message = self.records[self.position]
        else:
            image = self.query
            message = 'Which record contained this detail?'
        return PublicObs(text={'long_term_context': self.task_instruction(), 'short_term_context': message},
                         image=image, frame_id=f'f{self.position:05d}')

    def step(self, action):
        if self.position == len(self.frames):
            correct = action == self.records[self.sample]
            return StepResult(self.observe(), done=True, terminated=True,
                              private_record=correct, reward=float(correct))
        if action != 'Next':
            raise ValueError('Expected Next while visiting records')
        self.position += 1
        return StepResult(self.observe(), done=False)

    def score(self, private_record):
        return float(bool(private_record))


class PixelLookup:
    """Deterministic model for the starter program. It never receives the sample number."""

    def __init__(self, records):
        self.records = records

    def generate(self, call):
        if call.phase == 'LOG':
            return ModelReply('<|DONE|>')
        if call.step < len(self.records):
            if call.call_index == 1:
                label = json.dumps({'label': self.records[call.step]})
                return ModelReply(f'<|SAVE_FRAME|>{label}<|END|>')
            return ModelReply('<|ACTION|>Next<|END|>')

        # The first image is the query. A recall adds the requested saved view.
        if call.call_index > 1:
            query, saved_view = call.images
            if contains_crop(saved_view, query):
                source = self.records[call.call_index - 2]
                return ModelReply(f'<|ACTION|>{source}<|END|>')
        if call.call_index > len(self.records):
            raise RuntimeError('No recalled frame contained this crop')
        request = json.dumps({'image_id': f'img_{call.call_index:04d}'})
        return ModelReply(f'<|RECALL_IMAGE|>{request}<|END|>')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('collection', choices=('apollo', 'monet'))
    parser.add_argument('--sample', type=int, choices=(1, 2, 3), default=2)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent / 'field-cases'
    if not directory.is_dir():
        directory = directory.parent.parent / 'media' / 'field-cases'
    if not (directory / 'records.json').is_file():
        parser.error('Extract the complete archive_lookup.zip so field-cases is beside this script.')
    records = json.loads((directory / 'records.json').read_text(encoding='utf-8'))[args.collection]
    adapter = LookupAdapter(records, args.sample - 1, directory)
    program = files('visual_rsi').joinpath('inner', 'visual_memory')
    with TemporaryDirectory(prefix='visual-lookup-') as directory:
        result = run_episode(adapter, program, line='M', seed=0,
                             model=PixelLookup(adapter.records), archive=Path(directory))
    if result['score'] != 1 or not result['terminated']:
        raise RuntimeError(result.get('error') or result['status'])
    print(f"Saved records: {', '.join(adapter.records)}")
    print(f"Historical images recalled: {result['visual_requests']['valid']}")
    answer = result['actions'][-1]
    source = next(record['source'] for record in records if record['id'] == answer)
    print(f"Matching source: {answer}")
    print(source)


if __name__ == '__main__':
    main()
