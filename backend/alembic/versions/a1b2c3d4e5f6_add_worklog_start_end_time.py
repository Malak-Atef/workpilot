"""add_worklog_start_end_time

Revision ID: a1b2c3d4e5f6
Revises: 897f2b36abfb
Create Date: 2026-08-11 10:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '897f2b36abfb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    with op.batch_alter_table('work_logs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('start_time', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('end_time', sa.String(), nullable=True))

def downgrade() -> None:
    with op.batch_alter_table('work_logs', schema=None) as batch_op:
        batch_op.drop_column('end_time')
        batch_op.drop_column('start_time')
