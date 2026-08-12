"""sprint1_contract_update

Revision ID: 897f2b36abfb
Revises: None
Create Date: 2026-08-08 22:18:07.348331

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from models import SQLModel


# revision identifiers, used by Alembic.
revision: str = '897f2b36abfb'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    SQLModel.metadata.create_all(op.get_bind())


def downgrade() -> None:
    with op.batch_alter_table('suggestion', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('resulting_id')
        batch_op.drop_column('source_ref_id')
        batch_op.drop_column('source')
        batch_op.drop_column('suggestion_type')
        batch_op.drop_column('payload')

    with op.batch_alter_table('captureditem', schema=None) as batch_op:
        batch_op.drop_column('interpretation_status')
        batch_op.drop_column('captured_at')